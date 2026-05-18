import { Request, Response } from 'express';
import { CURRICULUM_DATA } from '../data/curriculumData';

export const getMetadata = async (req: Request, res: Response) => {
    try {
        const { curriculum, class: grade } = req.query;
        console.log(`[CURRICULUM_REQUEST] Board: ${curriculum}, Grade: ${grade}`);

        if (!curriculum || !grade) {
            return res.status(400).json({ 
                success: false, 
                data: null, 
                error: "Missing curriculum or class query param" 
            });
        }

        const boardKey = curriculum as string;
        const gradeKey = grade as string;

        if (!CURRICULUM_DATA) {
            console.error("[CRITICAL] CURRICULUM_DATA is undefined or null");
            throw new Error("Curriculum database not initialized");
        }

        const boardData = CURRICULUM_DATA[boardKey];
        if (!boardData) {
            console.warn(`[CURRICULUM_NOT_FOUND] Board: ${boardKey}`);
            return res.status(404).json({ 
                success: false, 
                data: null, 
                error: "Curriculum board not found in metadata registry" 
            });
        }

        const classData = boardData[gradeKey];
        if (!classData) {
            console.warn(`[GRADE_NOT_FOUND] Grade: ${gradeKey} for Board: ${boardKey}`);
            return res.status(404).json({ 
                success: false, 
                data: null, 
                error: `Grade level ${gradeKey} not found for ${boardKey}` 
            });
        }

        const subjects = Object.keys(classData);
        const topics = classData;

        res.json({ 
            success: true, 
            data: { subjects, topics }, 
            error: null 
        });
    } catch (error: any) {
        console.error("[CURRICULUM CONTROLLER] Metadata Error:", error);
        res.status(500).json({ 
            success: false, 
            data: null, 
            error: error.message || "Failed to retrieve curriculum metadata" 
        });
    }
};


export const getBoards = async (req: Request, res: Response) => {
    try {
        const boards = Object.keys(CURRICULUM_DATA);
        res.json({ success: true, data: boards, error: null });
    } catch (error: any) {
        res.status(500).json({ success: false, data: null, error: error.message || "Failed to fetch boards" });
    }
};
