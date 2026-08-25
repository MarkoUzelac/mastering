#include <algorithm>
#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <emscripten/emscripten.h>

namespace {

constexpr double PI = 3.141592653589793238462643383279502884;

inline double clampd(double value, double minValue, double maxValue) {
    return std::max(minValue, std::min(value, maxValue));
}

inline double dbToGain(double value) {
    return std::pow(10.0, value / 20.0);
}

inline double gainToDb(double value) {
    return 20.0 * std::log10(std::max(value, 1e-8));
}

class Biquad {
public:
    Biquad(double sampleRate, double frequency, double q, int type)
        : sampleRate_(sampleRate), frequency_(frequency), q_(q), type_(type) {
        setGain(0.0);
    }

    void setGain(double gainDb) {
        const double amplitude = std::pow(10.0, gainDb / 40.0);
        const double omega = 2.0 * PI * frequency_ / sampleRate_;
        const double cosine = std::cos(omega);
        const double sine = std::sin(omega);
        const double alpha = sine / (2.0 * q_);
        const double rootAmplitude = std::sqrt(amplitude);
        double b0;
        double b1;
        double b2;
        double a0;
        double a1;
        double a2;

        if (type_ == 0) { // peaking
            b0 = 1.0 + alpha * amplitude;
            b1 = -2.0 * cosine;
            b2 = 1.0 - alpha * amplitude;
            a0 = 1.0 + alpha / amplitude;
            a1 = -2.0 * cosine;
            a2 = 1.0 - alpha / amplitude;
        } else if (type_ == 1) { // lowshelf
            const double slope = 2.0 * rootAmplitude * alpha;
            b0 = amplitude * ((amplitude + 1.0) - (amplitude - 1.0) * cosine + slope);
            b1 = 2.0 * amplitude * ((amplitude - 1.0) - (amplitude + 1.0) * cosine);
            b2 = amplitude * ((amplitude + 1.0) - (amplitude - 1.0) * cosine - slope);
            a0 = (amplitude + 1.0) + (amplitude - 1.0) * cosine + slope;
            a1 = -2.0 * ((amplitude - 1.0) + (amplitude + 1.0) * cosine);
            a2 = (amplitude + 1.0) + (amplitude - 1.0) * cosine - slope;
        } else { // highshelf
            const double slope = 2.0 * rootAmplitude * alpha;
            b0 = amplitude * ((amplitude + 1.0) + (amplitude - 1.0) * cosine + slope);
            b1 = -2.0 * amplitude * ((amplitude - 1.0) + (amplitude + 1.0) * cosine);
            b2 = amplitude * ((amplitude + 1.0) + (amplitude - 1.0) * cosine - slope);
            a0 = (amplitude + 1.0) - (amplitude - 1.0) * cosine + slope;
            a1 = 2.0 * ((amplitude - 1.0) - (amplitude + 1.0) * cosine);
            a2 = (amplitude + 1.0) - (amplitude - 1.0) * cosine - slope;
        }

        b0_ = b0 / a0;
        b1_ = b1 / a0;
        b2_ = b2 / a0;
        a1_ = a1 / a0;
        a2_ = a2 / a0;
    }

    double process(double sample) {
        const double output = sample * b0_ + z1_;
        z1_ = sample * b1_ - output * a1_ + z2_;
        z2_ = sample * b2_ - output * a2_;
        return output;
    }

private:
    double sampleRate_;
    double frequency_;
    double q_;
    int type_;
    double b0_ = 1.0;
    double b1_ = 0.0;
    double b2_ = 0.0;
    double a1_ = 0.0;
    double a2_ = 0.0;
    double z1_ = 0.0;
    double z2_ = 0.0;
};

class MasteringProcessor {
public:
    explicit MasteringProcessor(double sampleRate)
        : sampleRate_(sampleRate),
          low_(sampleRate, 120.0, 0.707, 1),
          mid_(sampleRate, 1200.0, 0.8, 0),
          high_(sampleRate, 8500.0, 0.707, 2) {}

    void setParameters(double lowDb, double midDb, double highDb,
                       double thresholdDb, double ratio, double gainDb) {
        low_.setGain(lowDb);
        mid_.setGain(midDb);
        high_.setGain(highDb);
        threshold_ = thresholdDb;
        ratio_ = ratio;
        makeup_ = dbToGain(gainDb);
        attack_ = std::exp(-1.0 / (0.02 * sampleRate_));
        release_ = std::exp(-1.0 / (0.24 * sampleRate_));
        limitRelease_ = std::exp(-1.0 / (0.08 * sampleRate_));
        ceiling_ = dbToGain(-1.0);
    }

    void processStereo(const float* leftIn, const float* rightIn,
                       float* leftOut, float* rightOut, int numSamples) {
        for (int frame = 0; frame < numSamples; ++frame) {
            const double left = static_cast<double>(leftIn[frame]);
            const double right = static_cast<double>(rightIn[frame]);

            double leftSample = low_.process(left);
            leftSample = mid_.process(leftSample);
            leftSample = high_.process(leftSample);

            double rightSample = lowRight_.process(right);
            rightSample = midRight_.process(rightSample);
            rightSample = highRight_.process(rightSample);

            const double detector = std::max(std::abs(leftSample), std::abs(rightSample));
            const double coefficient = detector > envelope_ ? attack_ : release_;
            envelope_ = detector + coefficient * (envelope_ - detector);

            const double overDb = gainToDb(envelope_) - threshold_;
            const double reductionDb = overDb > 0.0
                ? -overDb * (1.0 - 1.0 / std::max(1.0, ratio_))
                : 0.0;
            const double compressorGain = dbToGain(reductionDb) * makeup_;
            const double postPeak = detector * compressorGain;
            const double targetLimiter = postPeak > ceiling_
                ? ceiling_ / postPeak
                : 1.0;

            limiterGain_ = targetLimiter < limiterGain_
                ? targetLimiter
                : 1.0 + limitRelease_ * (limiterGain_ - 1.0);

            leftOut[frame] = static_cast<float>(clampd(
                leftSample * compressorGain * limiterGain_,
                -ceiling_, ceiling_));
            rightOut[frame] = static_cast<float>(clampd(
                rightSample * compressorGain * limiterGain_,
                -ceiling_, ceiling_));
        }
    }

private:
    double sampleRate_;
    Biquad low_;
    Biquad mid_;
    Biquad high_;
    Biquad lowRight_{sampleRate_, 120.0, 0.707, 1};
    Biquad midRight_{sampleRate_, 1200.0, 0.8, 0};
    Biquad highRight_{sampleRate_, 8500.0, 0.707, 2};
    double threshold_ = -24.0;
    double ratio_ = 3.0;
    double makeup_ = 1.0;
    double attack_ = 0.0;
    double release_ = 0.0;
    double limitRelease_ = 0.0;
    double ceiling_ = 1.0;
    double envelope_ = 0.0;
    double limiterGain_ = 1.0;
};

} // namespace

extern "C" {

EMSCRIPTEN_KEEPALIVE
float* run_production_test(
    const float* leftIn,
    const float* rightIn,
    int numSamples,
    double sampleRate,
    double lowDb,
    double midDb,
    double highDb,
    double thresholdDb,
    double ratio,
    double gainDb
) {
    if (!leftIn || !rightIn || numSamples <= 0 || sampleRate <= 0.0) return nullptr;

    auto* output = static_cast<float*>(
        std::malloc(static_cast<std::size_t>(numSamples) * 2u * sizeof(float)));
    if (!output) return nullptr;

    MasteringProcessor processor(sampleRate);
    processor.setParameters(lowDb, midDb, highDb, thresholdDb, ratio, gainDb);

    processor.processStereo(
        leftIn,
        rightIn,
        output,
        output + numSamples,
        numSamples);

    return output;
}

EMSCRIPTEN_KEEPALIVE
void free_buffer(float* buffer) {
    std::free(buffer);
}

}
