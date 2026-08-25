#include <cmath>
#include <cstdint>
#include <cstdlib>
#include <emscripten/emscripten.h>

namespace {
constexpr double PI = 3.141592653589793238462643383279502884;

class Biquad {
public:
    void setLowShelf(double sampleRate, double frequency, double gainDb, double q) {
        const double A = std::pow(10.0, gainDb / 40.0);
        const double w0 = 2.0 * PI * frequency / sampleRate;
        const double cs = std::cos(w0);
        const double sn = std::sin(w0);
        const double alpha = sn / (2.0 * q);
        const double sqrtA = std::sqrt(A);
        const double b0 = A * ((A + 1.0) - (A - 1.0) * cs + 2.0 * sqrtA * alpha);
        const double b1 = 2.0 * A * ((A - 1.0) - (A + 1.0) * cs);
        const double b2 = A * ((A + 1.0) - (A - 1.0) * cs - 2.0 * sqrtA * alpha);
        const double a0 = (A + 1.0) + (A - 1.0) * cs + 2.0 * sqrtA * alpha;
        const double a1 = -2.0 * ((A - 1.0) + (A + 1.0) * cs);
        const double a2 = (A + 1.0) + (A - 1.0) * cs - 2.0 * sqrtA * alpha;
        normalize(b0, b1, b2, a0, a1, a2);
    }

    void setPeaking(double sampleRate, double frequency, double gainDb, double q) {
        const double A = std::pow(10.0, gainDb / 40.0);
        const double w0 = 2.0 * PI * frequency / sampleRate;
        const double cs = std::cos(w0);
        const double sn = std::sin(w0);
        const double alpha = sn / (2.0 * q);
        const double b0 = 1.0 + alpha * A;
        const double b1 = -2.0 * cs;
        const double b2 = 1.0 - alpha * A;
        const double a0 = 1.0 + alpha / A;
        const double a1 = -2.0 * cs;
        const double a2 = 1.0 - alpha / A;
        normalize(b0, b1, b2, a0, a1, a2);
    }

    void setHighShelf(double sampleRate, double frequency, double gainDb, double q) {
        const double A = std::pow(10.0, gainDb / 40.0);
        const double w0 = 2.0 * PI * frequency / sampleRate;
        const double cs = std::cos(w0);
        const double sn = std::sin(w0);
        const double alpha = sn / (2.0 * q);
        const double sqrtA = std::sqrt(A);
        const double b0 = A * ((A + 1.0) + (A - 1.0) * cs + 2.0 * sqrtA * alpha);
        const double b1 = -2.0 * A * ((A - 1.0) + (A + 1.0) * cs);
        const double b2 = A * ((A + 1.0) + (A - 1.0) * cs - 2.0 * sqrtA * alpha);
        const double a0 = (A + 1.0) - (A - 1.0) * cs + 2.0 * sqrtA * alpha;
        const double a1 = 2.0 * ((A - 1.0) - (A + 1.0) * cs);
        const double a2 = (A + 1.0) - (A - 1.0) * cs - 2.0 * sqrtA * alpha;
        normalize(b0, b1, b2, a0, a1, a2);
    }

    float process(float input) {
        const double x = static_cast<double>(input);
        const double y = b0_ * x + z1_;
        const double newZ1 = b1_ * x - a1_ * y + z2_;
        const double newZ2 = b2_ * x - a2_ * y;
        z1_ = newZ1;
        z2_ = newZ2;
        return static_cast<float>(y);
    }

private:
    void normalize(double b0, double b1, double b2, double a0, double a1, double a2) {
        b0_ = b0 / a0; b1_ = b1 / a0; b2_ = b2 / a0;
        a1_ = a1 / a0; a2_ = a2 / a0;
    }
    double b0_ = 1.0, b1_ = 0.0, b2_ = 0.0, a1_ = 0.0, a2_ = 0.0;
    double z1_ = 0.0, z2_ = 0.0;
};
}

extern "C" {
EMSCRIPTEN_KEEPALIVE
float* run_eq_test(const float* input, int numSamples, double sampleRate,
                   double freqLow, double gainLow, double qLow,
                   double freqMid, double gainMid, double qMid,
                   double freqHigh, double gainHigh, double qHigh) {
    if (!input || numSamples <= 0 || sampleRate <= 0.0) return nullptr;
    auto* output = static_cast<float*>(std::malloc(static_cast<std::size_t>(numSamples) * sizeof(float)));
    if (!output) return nullptr;
    Biquad low, mid, high;
    low.setLowShelf(sampleRate, freqLow, gainLow, qLow);
    mid.setPeaking(sampleRate, freqMid, gainMid, qMid);
    high.setHighShelf(sampleRate, freqHigh, gainHigh, qHigh);
    for (int i = 0; i < numSamples; ++i) {
        float y = low.process(input[i]);
        y = mid.process(y);
        y = high.process(y);
        output[i] = y;
    }
    return output;
}

EMSCRIPTEN_KEEPALIVE
void free_buffer(float* buffer) { std::free(buffer); }
}
