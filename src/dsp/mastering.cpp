#include <cmath>
#include <algorithm>
#include <vector>
#include <memory>
#include <cstdlib>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Numerical Source of Truth: src/audio/dsp-core.js
// Double precision internal processing, Float32 audio boundary.

enum class FilterType {
    LowShelf,
    Peaking,
    HighShelf
};

inline double clamp_val(double value, double min_val, double max_val) {
    return std::max(min_val, std::min(max_val, value));
}

inline double db_to_gain(double db) {
    return std::pow(10.0, db / 20.0);
}

inline double gain_to_db(double gain) {
    return 20.0 * std::log10(std::max(gain, 1e-8));
}

class BiquadFilter {
public:
    double sample_rate;
    FilterType type;
    double frequency;
    double q;
    double z1;
    double z2;
    double b0, b1, b2, a1, a2;

    BiquadFilter(double sr, FilterType t, double freq, double q_val = 0.707)
        : sample_rate(sr), type(t), frequency(freq), q(q_val), z1(0.0), z2(0.0) {
        set_gain(0.0);
    }

    void reset() {
        z1 = 0.0;
        z2 = 0.0;
    }

    void set_gain(double gain_db) {
        double amplitude = std::pow(10.0, gain_db / 40.0);
        double omega = 2.0 * M_PI * frequency / sample_rate;
        double cosine = std::cos(omega);
        double sine = std::sin(omega);
        double alpha = sine / (2.0 * q);
        double root_amplitude = std::sqrt(amplitude);

        double raw_b0 = 0.0, raw_b1 = 0.0, raw_b2 = 0.0;
        double raw_a0 = 1.0, raw_a1 = 0.0, raw_a2 = 0.0;

        if (type == FilterType::Peaking) {
            raw_b0 = 1.0 + alpha * amplitude;
            raw_b1 = -2.0 * cosine;
            raw_b2 = 1.0 - alpha * amplitude;
            raw_a0 = 1.0 + alpha / amplitude;
            raw_a1 = -2.0 * cosine;
            raw_a2 = 1.0 - alpha / amplitude;
        } else if (type == FilterType::LowShelf) {
            double slope = 2.0 * root_amplitude * alpha;
            raw_b0 = amplitude * ((amplitude + 1.0) - (amplitude - 1.0) * cosine + slope);
            raw_b1 = 2.0 * amplitude * ((amplitude - 1.0) - (amplitude + 1.0) * cosine);
            raw_b2 = amplitude * ((amplitude + 1.0) - (amplitude - 1.0) * cosine - slope);
            raw_a0 = (amplitude + 1.0) + (amplitude - 1.0) * cosine + slope;
            raw_a1 = -2.0 * ((amplitude - 1.0) + (amplitude + 1.0) * cosine);
            raw_a2 = (amplitude + 1.0) + (amplitude - 1.0) * cosine - slope;
        } else { // HighShelf
            double slope = 2.0 * root_amplitude * alpha;
            raw_b0 = amplitude * ((amplitude + 1.0) + (amplitude - 1.0) * cosine + slope);
            raw_b1 = -2.0 * amplitude * ((amplitude - 1.0) + (amplitude + 1.0) * cosine);
            raw_b2 = amplitude * ((amplitude + 1.0) + (amplitude - 1.0) * cosine - slope);
            raw_a0 = (amplitude + 1.0) - (amplitude - 1.0) * cosine + slope;
            raw_a1 = 2.0 * ((amplitude - 1.0) - (amplitude + 1.0) * cosine);
            raw_a2 = (amplitude + 1.0) - (amplitude - 1.0) * cosine - slope;
        }

        b0 = raw_b0 / raw_a0;
        b1 = raw_b1 / raw_a0;
        b2 = raw_b2 / raw_a0;
        a1 = raw_a1 / raw_a0;
        a2 = raw_a2 / raw_a0;
    }

    // Direct Form II Transposed (DF2T)
    inline double process(double sample) {
        double output = sample * b0 + z1;
        z1 = sample * b1 - output * a1 + z2;
        z2 = sample * b2 - output * a2;
        return output;
    }
};

struct ChannelFilters {
    BiquadFilter low;
    BiquadFilter mid;
    BiquadFilter high;

    ChannelFilters(double sr)
        : low(sr, FilterType::LowShelf, 120.0),
          mid(sr, FilterType::Peaking, 1200.0, 0.8),
          high(sr, FilterType::HighShelf, 8500.0) {}

    void reset() {
        low.reset();
        mid.reset();
        high.reset();
    }
};

class MasteringProcessor {
public:
    double sample_rate;
    double low_db;
    double mid_db;
    double high_db;
    double threshold_db;
    double ratio;
    double gain_db;

    double envelope;
    double limiter_gain;
    double makeup;
    double attack;
    double release;
    double limit_release;
    double ceiling;

    std::vector<ChannelFilters> filters;

    MasteringProcessor(double sr)
        : sample_rate(sr),
          low_db(0.0),
          mid_db(0.0),
          high_db(0.0),
          threshold_db(-24.0),
          ratio(3.0),
          gain_db(0.0),
          envelope(0.0),
          limiter_gain(1.0) {
        filters.emplace_back(sr);
        filters.emplace_back(sr);
        update_parameters();
    }

    void reset_state() {
        envelope = 0.0;
        limiter_gain = 1.0;
        for (auto& f : filters) {
            f.reset();
        }
    }

    void set_parameters(double low, double mid, double high, double threshold, double r, double gain) {
        low_db = low;
        mid_db = mid;
        high_db = high;
        threshold_db = threshold;
        ratio = r;
        gain_db = gain;
        update_parameters();
    }

    void update_parameters() {
        for (auto& f : filters) {
            f.low.set_gain(low_db);
            f.mid.set_gain(mid_db);
            f.high.set_gain(high_db);
        }
        makeup = db_to_gain(gain_db);
        attack = std::exp(-1.0 / (0.02 * sample_rate));
        release = std::exp(-1.0 / (0.24 * sample_rate));
        limit_release = std::exp(-1.0 / (0.08 * sample_rate));
        ceiling = db_to_gain(-1.0);
    }

    void process(const float* left, const float* right, float* left_out, float* right_out, int num_samples) {
        for (int frame = 0; frame < num_samples; ++frame) {
            double sample_l = filters[0].low.process(static_cast<double>(left[frame]));
            sample_l = filters[0].mid.process(sample_l);
            sample_l = filters[0].high.process(sample_l);

            double sample_r = filters[1].low.process(static_cast<double>(right[frame]));
            sample_r = filters[1].mid.process(sample_r);
            sample_r = filters[1].high.process(sample_r);

            // Stereo-linked detector
            double detector = std::max(std::abs(sample_l), std::abs(sample_r));

            // Envelope detection
            double coeff = detector > envelope ? attack : release;
            envelope = detector + coeff * (envelope - detector);

            // Compressor
            double over_db = gain_to_db(envelope) - threshold_db;
            double reduction_db = over_db > 0.0 ? -over_db * (1.0 - 1.0 / std::max(1.0, ratio)) : 0.0;
            double compressor_gain = db_to_gain(reduction_db) * makeup;

            // Stereo-linked limiter
            double post_peak = detector * compressor_gain;
            double target_limiter = post_peak > ceiling ? (ceiling / post_peak) : 1.0;
            limiter_gain = target_limiter < limiter_gain
                ? target_limiter
                : 1.0 + limit_release * (limiter_gain - 1.0);

            // Final processing & ceiling clamp in double, cast to float
            double total_mult = compressor_gain * limiter_gain;
            double out_l = clamp_val(sample_l * total_mult, -ceiling, ceiling);
            double out_r = clamp_val(sample_r * total_mult, -ceiling, ceiling);

            left_out[frame] = static_cast<float>(out_l);
            right_out[frame] = static_cast<float>(out_r);
        }
    }
};

extern "C" {

void* create_mastering_processor(double sample_rate) {
    return new MasteringProcessor(sample_rate);
}

void set_parameters(
    void* processor,
    double low_db,
    double mid_db,
    double high_db,
    double threshold_db,
    double ratio,
    double gain_db
) {
    if (!processor) return;
    static_cast<MasteringProcessor*>(processor)->set_parameters(
        low_db, mid_db, high_db, threshold_db, ratio, gain_db
    );
}

void reset_state(void* processor) {
    if (!processor) return;
    static_cast<MasteringProcessor*>(processor)->reset_state();
}

void process_audio_stereo(
    void* processor,
    const float* left,
    const float* right,
    float* left_out,
    float* right_out,
    int num_samples
) {
    if (!processor || !left || !right || !left_out || !right_out || num_samples <= 0) return;
    static_cast<MasteringProcessor*>(processor)->process(
        left, right, left_out, right_out, num_samples
    );
}

void destroy_processor(void* processor) {
    if (processor) {
        delete static_cast<MasteringProcessor*>(processor);
    }
}

}
