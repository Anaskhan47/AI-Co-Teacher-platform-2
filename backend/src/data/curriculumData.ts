
const CLASSES_1_5 = ["1", "2", "3", "4", "5"];
const CLASSES_6_8 = ["6", "7", "8"];
const CLASSES_9_10 = ["9", "10"];
const CLASSES_11_12 = ["11", "12"];

const SUBJECTS_PRIMARY = ["English", "Mathematics", "EVS", "Hindi"];
const SUBJECTS_MIDDLE = ["English", "Mathematics", "Science", "Social Studies", "Hindi", "Computer Science"];
const SUBJECTS_SECONDARY = ["English", "Mathematics", "Physics", "Chemistry", "Biology", "History", "Geography", "Civics", "Economics", "Computer Science"];
const SUBJECTS_SENIOR = ["English", "Mathematics", "Physics", "Chemistry", "Biology", "Accountancy", "Business Studies", "Economics", "Political Science", "History", "Psychology", "Computer Science"];

const TOPICS_DB: Record<string, string[]> = {
    "English": ["Nouns", "Pronouns", "Verbs", "Adjectives", "Tenses", "Articles", "Reading Comprehension", "Writing Skills", "Letter Writing", "Story Writing"],
    "Mathematics": ["Numbers", "Fractions", "Decimals", "Algebra", "Linear Equations", "Geometry", "Mensuration", "Trigonometry", "Probability", "Statistics"],
    "Science": ["Food and Nutrition", "Motion and Force", "Light", "Electricity", "Acids and Bases", "Metals and Non-metals", "Life Processes", "Reproduction", "Gravitation", "Ecosystems"],
    "EVS": ["My Family", "Plants", "Animals", "Water", "Air", "Shelter"],
    "Hindi": ["Vyakaran", "Kavita", "Kahani", "Nibandh"],
    "Computer Science": ["Computer Basics", "Hardware and Software", "Paint", "MS Office", "Programming Basics", "Internet Safety"],
    "Social Studies": ["Our Earth", "India", "Governments", "Early Humans"],
    "Physics": ["Motion", "Laws of Motion", "Work and Energy", "Sound", "Light", "Electricity", "Magnetic Effects"],
    "Chemistry": ["Atoms and Molecules", "Chemical Reactions", "Acids, Bases, Salts", "Carbon Compounds", "Periodic Table"],
    "Biology": ["Cell Structure", "Tissues", "Nutrition", "Respiration", "Reproduction", "Heredity", "Environment"],
    "History": ["Civilizations", "Revolutions", "Nationalism", "World Wars", "Freedom Struggle"],
    "Geography": ["Climate", "Resources", "Agriculture", "Minerals", "Manufacturing"],
    "Civics": ["Democracy", "Constitution", "Rights", "Power Sharing", "Federalism"],
    "Economics": ["Poverty", "Development", "Markets", "Money and Credit", "Consumer Rights"],
    "Accountancy": ["Introduction to Accounting", "Journal and Ledger", "Trial Balance", "Depreciation", "Financial Statements"],
    "Business Studies": ["Nature and Significance of Management", "Principles of Management", "Marketing", "Consumer Protection"],
    "Political Science": ["Cold War", "End of Bipolarity", "US Hegemony", "International Organizations"],
    "Psychology": ["Intelligence", "Personality", "Human Development", "Therapeutic Approaches"]
};

const generateBoardData = () => {
    const boardData: any = {};
    CLASSES_1_5.forEach(cls => {
        boardData[cls] = {};
        SUBJECTS_PRIMARY.forEach(sub => { boardData[cls][sub] = TOPICS_DB[sub] || ["General"]; });
    });
    CLASSES_6_8.forEach(cls => {
        boardData[cls] = {};
        SUBJECTS_MIDDLE.forEach(sub => { boardData[cls][sub] = TOPICS_DB[sub] || ["General"]; });
    });
    CLASSES_9_10.forEach(cls => {
        boardData[cls] = {};
        SUBJECTS_SECONDARY.forEach(sub => { boardData[cls][sub] = TOPICS_DB[sub] || ["General"]; });
    });
    CLASSES_11_12.forEach(cls => {
        boardData[cls] = {};
        SUBJECTS_SENIOR.forEach(sub => { boardData[cls][sub] = TOPICS_DB[sub] || ["General"]; });
    });
    return boardData;
};

console.log("[CURRICULUM_DATA] Initializing master metadata registry...");
export const CURRICULUM_DATA: Record<string, any> = {
    "CBSE":  generateBoardData(),
    "ICSE":  generateBoardData(),
    "IGCSE": generateBoardData(),
    "IB":    generateBoardData(),
    "STATE": generateBoardData(),
    "SSC":   generateBoardData(),
};
console.log("[CURRICULUM_DATA] Master registry locked and loaded. Boards:", Object.keys(CURRICULUM_DATA));
