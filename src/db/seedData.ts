import type { Equipment, MuscleGroup } from '@/constants/muscles';
import { slugify } from '@/utils/slug';

export type SeedExercise = {
  /** Stable identifier for built-in exercises (e.g. bundled images are keyed by it). */
  key: string;
  nameEn: string;
  nameAr: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
};

const e = (
  nameEn: string,
  nameAr: string,
  muscleGroup: MuscleGroup,
  equipment: Equipment,
): SeedExercise => ({
  key: slugify(nameEn),
  nameEn,
  nameAr,
  muscleGroup,
  equipment,
});

export const SEED_EXERCISES: readonly SeedExercise[] = [
  // Chest
  e('Barbell Bench Press', 'بنش بريس بار', 'chest', 'barbell'),
  e('Incline Barbell Bench Press', 'بنش عالي بار', 'chest', 'barbell'),
  e('Decline Barbell Bench Press', 'بنش سفلي بار', 'chest', 'barbell'),
  e('Dumbbell Bench Press', 'بنش بريس دمبل', 'chest', 'dumbbell'),
  e('Incline Dumbbell Press', 'بنش عالي دمبل', 'chest', 'dumbbell'),
  e('Dumbbell Fly', 'تفتيح دمبل', 'chest', 'dumbbell'),
  e('Machine Chest Press', 'تشست بريس جهاز', 'chest', 'machine'),
  e('Pec Deck Fly', 'جهاز تفتيح (بيك دك)', 'chest', 'machine'),
  e('Cable Crossover', 'كروس أوفر', 'chest', 'cable'),
  e('Low-to-High Cable Fly', 'تفتيح كيبل من الأسفل', 'chest', 'cable'),
  e('Push-Up', 'ضغط', 'chest', 'bodyweight'),
  e('Chest Dip', 'متوازي صدر', 'chest', 'bodyweight'),

  // Back
  e('Deadlift', 'ديدلفت', 'back', 'barbell'),
  e('Barbell Row', 'تجديف بار', 'back', 'barbell'),
  e('T-Bar Row', 'تي بار', 'back', 'barbell'),
  e('One-Arm Dumbbell Row', 'تجديف دمبل يد واحدة', 'back', 'dumbbell'),
  e('Dumbbell Pullover', 'بول أوفر دمبل', 'back', 'dumbbell'),
  e('Lat Pulldown', 'سحب أمامي', 'back', 'cable'),
  e('Close-Grip Lat Pulldown', 'سحب أمامي قبضة ضيقة', 'back', 'cable'),
  e('Seated Cable Row', 'سحب أرضي', 'back', 'cable'),
  e('Straight-Arm Pulldown', 'بول أوفر كيبل', 'back', 'cable'),
  e('Machine Row', 'تجديف جهاز', 'back', 'machine'),
  e('Back Extension', 'ظهر سفلي (هايبر)', 'back', 'machine'),
  e('Pull-Up', 'عقلة', 'back', 'bodyweight'),

  // Shoulders
  e('Overhead Barbell Press', 'ضغط أكتاف بار (ملتري)', 'shoulders', 'barbell'),
  e('Barbell Upright Row', 'سحب للذقن بار', 'shoulders', 'barbell'),
  e('Seated Dumbbell Shoulder Press', 'ضغط أكتاف دمبل', 'shoulders', 'dumbbell'),
  e('Arnold Press', 'أرنولد بريس', 'shoulders', 'dumbbell'),
  e('Dumbbell Lateral Raise', 'رفرفة جانبي دمبل', 'shoulders', 'dumbbell'),
  e('Dumbbell Front Raise', 'رفرفة أمامي دمبل', 'shoulders', 'dumbbell'),
  e('Rear Delt Dumbbell Fly', 'كتف خلفي دمبل', 'shoulders', 'dumbbell'),
  e('Dumbbell Shrug', 'ترابيس دمبل', 'shoulders', 'dumbbell'),
  e('Machine Shoulder Press', 'ضغط أكتاف جهاز', 'shoulders', 'machine'),
  e('Reverse Pec Deck', 'كتف خلفي جهاز', 'shoulders', 'machine'),
  e('Cable Lateral Raise', 'رفرفة جانبي كيبل', 'shoulders', 'cable'),
  e('Face Pull', 'فيس بول', 'shoulders', 'cable'),

  // Biceps
  e('Barbell Curl', 'بايسبس بار', 'biceps', 'barbell'),
  e('EZ-Bar Curl', 'بايسبس بار زجزاج', 'biceps', 'barbell'),
  e('Dumbbell Curl', 'بايسبس دمبل', 'biceps', 'dumbbell'),
  e('Hammer Curl', 'هامر', 'biceps', 'dumbbell'),
  e('Incline Dumbbell Curl', 'بايسبس دمبل مائل', 'biceps', 'dumbbell'),
  e('Concentration Curl', 'بايسبس تركيز', 'biceps', 'dumbbell'),
  e('Preacher Curl', 'بايسبس ارتكاز', 'biceps', 'barbell'),
  e('Machine Preacher Curl', 'بايسبس جهاز', 'biceps', 'machine'),
  e('Cable Curl', 'بايسبس كيبل', 'biceps', 'cable'),

  // Triceps
  e('Close-Grip Bench Press', 'بنش قبضة ضيقة', 'triceps', 'barbell'),
  e('Skull Crusher', 'ترايسبس فرنسي بار', 'triceps', 'barbell'),
  e('Overhead Dumbbell Extension', 'ترايسبس دمبل خلف الرأس', 'triceps', 'dumbbell'),
  e('Dumbbell Kickback', 'كيك باك دمبل', 'triceps', 'dumbbell'),
  e('Machine Triceps Extension', 'ترايسبس جهاز', 'triceps', 'machine'),
  e('Cable Pushdown', 'ترايسبس كيبل', 'triceps', 'cable'),
  e('Rope Pushdown', 'ترايسبس حبل', 'triceps', 'cable'),
  e('Overhead Cable Extension', 'ترايسبس كيبل خلف الرأس', 'triceps', 'cable'),
  e('Triceps Dip', 'متوازي ترايسبس', 'triceps', 'bodyweight'),

  // Legs
  e('Back Squat', 'سكوات', 'legs', 'barbell'),
  e('Front Squat', 'سكوات أمامي', 'legs', 'barbell'),
  e('Romanian Deadlift', 'ديدلفت روماني', 'legs', 'barbell'),
  e('Goblet Squat', 'سكوات دمبل (جوبلت)', 'legs', 'dumbbell'),
  e('Dumbbell Walking Lunge', 'طعنات دمبل (لانجز)', 'legs', 'dumbbell'),
  e('Bulgarian Split Squat', 'سكوات بلغاري', 'legs', 'dumbbell'),
  e('Leg Press', 'ليج بريس', 'legs', 'machine'),
  e('Hack Squat', 'هاك سكوات', 'legs', 'machine'),
  e('Smith Machine Squat', 'سكوات سميث', 'legs', 'machine'),
  e('Leg Extension', 'رفرفة أمامي (ليج إكستنشن)', 'legs', 'machine'),
  e('Lying Leg Curl', 'رفرفة خلفي نائم', 'legs', 'machine'),
  e('Seated Leg Curl', 'رفرفة خلفي جالس', 'legs', 'machine'),
  e('Hip Adduction Machine', 'جهاز ضم الأرجل', 'legs', 'machine'),
  e('Standing Cable Leg Curl', 'رفرفة خلفي كيبل واقف', 'legs', 'cable'),

  // Glutes
  e('Barbell Hip Thrust', 'هيب ثرست بار', 'glutes', 'barbell'),
  e('Sumo Deadlift', 'ديدلفت سومو', 'glutes', 'barbell'),
  e('Dumbbell Step-Up', 'صعود على صندوق دمبل', 'glutes', 'dumbbell'),
  e('Hip Abduction Machine', 'جهاز فتح الأرجل', 'glutes', 'machine'),
  e('Machine Glute Kickback', 'ركل خلفي جهاز', 'glutes', 'machine'),
  e('Cable Glute Kickback', 'ركل خلفي كيبل', 'glutes', 'cable'),
  e('Cable Pull-Through', 'سحب بين الأرجل كيبل', 'glutes', 'cable'),
  e('Glute Bridge', 'جسر المؤخرة', 'glutes', 'bodyweight'),

  // Calves
  e('Standing Barbell Calf Raise', 'سمانة بار واقف', 'calves', 'barbell'),
  e('Dumbbell Calf Raise', 'سمانة دمبل', 'calves', 'dumbbell'),
  e('Standing Calf Raise Machine', 'سمانة واقف جهاز', 'calves', 'machine'),
  e('Seated Calf Raise', 'سمانة جالس', 'calves', 'machine'),
  e('Leg Press Calf Raise', 'سمانة على الليج بريس', 'calves', 'machine'),
  e('Cable Calf Raise', 'سمانة كيبل', 'calves', 'cable'),

  // Abs
  e('Barbell Rollout', 'رول آوت بار', 'abs', 'barbell'),
  e('Dumbbell Side Bend', 'ميلان جانبي دمبل', 'abs', 'dumbbell'),
  e('Russian Twist', 'روسيان تويست', 'abs', 'dumbbell'),
  e('Ab Crunch Machine', 'جهاز بطن', 'abs', 'machine'),
  e('Cable Crunch', 'كرنش كيبل', 'abs', 'cable'),
  e('Cable Woodchopper', 'وود تشوبر كيبل', 'abs', 'cable'),
  e('Crunch', 'كرنش', 'abs', 'bodyweight'),
  e('Hanging Leg Raise', 'رفع أرجل معلّق', 'abs', 'bodyweight'),
  e('Plank', 'بلانك', 'abs', 'bodyweight'),
  e('Ab Wheel Rollout', 'عجلة البطن', 'abs', 'other'),

  // Forearms
  e('Barbell Wrist Curl', 'ساعد بار', 'forearms', 'barbell'),
  e('Reverse Barbell Curl', 'بايسبس عكسي بار', 'forearms', 'barbell'),
  e('Dumbbell Wrist Curl', 'ساعد دمبل', 'forearms', 'dumbbell'),
  e("Farmer's Walk", 'مشي المزارع', 'forearms', 'dumbbell'),
  e('Behind-the-Back Smith Wrist Curl', 'ساعد خلف الظهر سميث', 'forearms', 'machine'),
  e('Cable Wrist Curl', 'ساعد كيبل', 'forearms', 'cable'),
];
