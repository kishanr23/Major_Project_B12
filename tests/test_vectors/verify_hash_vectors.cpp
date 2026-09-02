/**
 * verify_hash_vectors.cpp — C++ firmware cross-language verifier.
 *
 * Build & run (standalone, no Meshtastic deps needed):
 *   g++ -std=c++17 -o verify_hash_vectors test_vectors/verify_hash_vectors.cpp && ./verify_hash_vectors
 *
 * Verifies the djb2-64 hash implementation against the canonical test vectors
 * in hash_vectors.json (read at runtime from the file path relative to CWD).
 *
 * SIMULATED — exercises the hash algorithm only; no radio hardware needed.
 *
 * Note: JSON is parsed with a minimal hand-rolled parser to avoid adding a
 * dependency (nlohmann/json, etc.) to the firmware build environment.
 */

#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <fstream>
#include <sstream>
#include <string>
#include <vector>

// ── djb2-64 (mirrors firmware/modules/trailguard/crypto_utils.h) ─────────────
static uint64_t djb2_64(const std::string& s) {
    uint64_t h = 5381ULL;
    for (unsigned char c : s) {
        h = ((h << 5) + h) + static_cast<uint64_t>(c);
    }
    return h;
}

static std::string to_hex16(uint64_t n) {
    char buf[17];
    std::snprintf(buf, sizeof(buf), "%016llx", (unsigned long long)n);
    return std::string(buf);
}

// ── Minimal JSON string-array extractor ──────────────────────────────────────
// Extracts all string values associated with a given key across the file.
static std::vector<std::string> extract_string_values(const std::string& json,
                                                       const std::string& key) {
    std::vector<std::string> result;
    std::string search = "\"" + key + "\":";
    size_t pos = 0;
    while ((pos = json.find(search, pos)) != std::string::npos) {
        pos += search.size();
        // skip whitespace
        while (pos < json.size() && json[pos] == ' ') ++pos;
        if (pos < json.size() && json[pos] == '"') {
            ++pos;
            std::string val;
            while (pos < json.size() && json[pos] != '"') {
                val += json[pos++];
            }
            result.push_back(val);
        }
    }
    return result;
}

// ── Test runner ───────────────────────────────────────────────────────────────
int main(int argc, char* argv[]) {
    const char* vectors_path = "test_vectors/hash_vectors.json";
    if (argc > 1) vectors_path = argv[1];

    std::ifstream f(vectors_path);
    if (!f) {
        fprintf(stderr, "Cannot open %s\n", vectors_path);
        return 1;
    }
    std::ostringstream ss;
    ss << f.rdbuf();
    const std::string json = ss.str();

    auto inputs   = extract_string_values(json, "input");
    auto hexvals  = extract_string_values(json, "hex");
    auto decimals = extract_string_values(json, "decimal");

    printf("[SIMULATED] C++ firmware djb2-64 Hash Vector Verification\n\n");

    if (inputs.size() != hexvals.size() || inputs.size() != decimals.size()) {
        fprintf(stderr, "Malformed JSON: vector lengths don't match "
                        "(%zu inputs, %zu hex, %zu decimal)\n",
                inputs.size(), hexvals.size(), decimals.size());
        return 1;
    }

    int passed = 0, failed = 0;
    for (size_t i = 0; i < inputs.size(); ++i) {
        uint64_t got = djb2_64(inputs[i]);
        std::string got_hex = to_hex16(got);
        std::string got_dec = std::to_string(got);
        bool ok = (got_hex == hexvals[i]) && (got_dec == decimals[i]);
        printf("  [%s] input=\"%s\" expected=%s got=%s\n",
               ok ? "PASS" : "FAIL",
               inputs[i].c_str(),
               hexvals[i].c_str(),
               got_hex.c_str());
        ok ? ++passed : ++failed;
    }

    printf("\n%d total — %d passed, %d failed\n", passed + failed, passed, failed);
    if (failed > 0) {
        fprintf(stderr, "HASH VECTOR VERIFICATION FAILED\n");
        return 1;
    }
    printf("ALL HASH VECTOR TESTS PASSED\n");
    return 0;
}
