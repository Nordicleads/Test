import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import type { BuildingCategory } from "@wandr/shared";
import { CATEGORY_LABELS, FITNESS_STEP_GOALS } from "@wandr/shared";

const DISPLAYED_CATEGORIES: BuildingCategory[] = [
  "new_build",
  "medieval",
  "civic",
  "transformation",
  "under_construction",
  "landmark",
  "religious",
  "industrial_heritage",
  "unesco",
];

const STOP_OPTIONS = [
  { label: "Auto", value: 0 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "5", value: 5 },
  { label: "8", value: 8 },
  { label: "10", value: 10 },
] as const;

interface Props {
  selectedCategories: BuildingCategory[];
  onToggleCategory: (cat: BuildingCategory) => void;
  stepGoal: number;
  onStepGoal: (goal: number) => void;
  maxStops: number;
  onMaxStops: (n: number) => void;
  stepFreeOnly?: boolean;
  onToggleStepFree?: () => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function FilterBar({
  selectedCategories,
  onToggleCategory,
  stepGoal,
  onStepGoal,
  maxStops,
  onMaxStops,
  stepFreeOnly = false,
  onToggleStepFree,
  onGenerate,
  isGenerating,
}: Props) {
  return (
    <View style={styles.container}>
      {/* Step goal selector */}
      <View style={styles.section}>
        <Text style={styles.label}>STEP GOAL</Text>
        <View style={styles.row}>
          {FITNESS_STEP_GOALS.map((goal) => (
            <TouchableOpacity
              key={goal}
              style={[styles.goalChip, stepGoal === goal && styles.goalChipActive]}
              onPress={() => onStepGoal(goal)}
            >
              <Text style={[styles.goalText, stepGoal === goal && styles.goalTextActive]}>
                {(goal / 1000).toFixed(0)}k
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Stops selector */}
      <View style={styles.section}>
        <Text style={styles.label}>BUILDINGS TO VISIT</Text>
        <View style={styles.row}>
          {STOP_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.goalChip, maxStops === opt.value && styles.goalChipActive]}
              onPress={() => onMaxStops(opt.value)}
            >
              <Text style={[styles.goalText, maxStops === opt.value && styles.goalTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Category filter */}
      <View style={styles.section}>
        <Text style={styles.label}>FILTER BY TYPE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.row}>
            {DISPLAYED_CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => onToggleCategory(cat)}
                >
                  <Text style={[styles.catText, active && styles.catTextActive]}>
                    {CATEGORY_LABELS[cat]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Accessibility toggle */}
      {onToggleStepFree && (
        <TouchableOpacity
          style={[styles.accessChip, stepFreeOnly && styles.accessChipActive]}
          onPress={onToggleStepFree}
        >
          <Text style={[styles.accessText, stepFreeOnly && styles.accessTextActive]}>
            ♿ Step-Free Routes Only
          </Text>
        </TouchableOpacity>
      )}

      {/* Generate button */}
      <TouchableOpacity
        style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
        onPress={onGenerate}
        disabled={isGenerating}
      >
        <Text style={styles.generateText}>
          {isGenerating ? "Finding your route…" : "Generate Route"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#111", paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  section: { gap: 8 },
  label: { fontSize: 10, color: "#555", letterSpacing: 2, fontWeight: "600" },
  row: { flexDirection: "row", gap: 8, flexWrap: "wrap" },

  goalChip: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  goalChipActive: { borderColor: "#d4a853", backgroundColor: "#d4a853" },
  goalText: { color: "#555", fontSize: 13, fontWeight: "600" },
  goalTextActive: { color: "#0f0f0f" },

  catChip: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catChipActive: { borderColor: "#d4a853" },
  catText: { color: "#555", fontSize: 12 },
  catTextActive: { color: "#d4a853" },

  accessChip: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  accessChipActive: { borderColor: "#d4a853", backgroundColor: "rgba(212,168,83,0.1)" },
  accessText: { color: "#555", fontSize: 13 },
  accessTextActive: { color: "#d4a853", fontWeight: "600" },

  generateBtn: {
    backgroundColor: "#d4a853",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
  },
  generateBtnDisabled: { opacity: 0.5 },
  generateText: { color: "#0f0f0f", fontWeight: "700", fontSize: 15, letterSpacing: 0.5 },
});
