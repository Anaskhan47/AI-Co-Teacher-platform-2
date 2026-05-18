import { BoardType, PrismaClient } from '@prisma/client';

export async function resolveCurriculumTopic(
  prisma: PrismaClient,
  input: { board: string; grade: number; subjectName: string; topicName: string; }
) {
  const { board, grade, subjectName, topicName } = input;

  // 1. Board Normalization (Prisma Enum Safety)
  const ENUM_SAFE_BOARDS = ['CBSE', 'ICSE', 'SSC'];
  const dbBoard = (board && ENUM_SAFE_BOARDS.includes(board.toUpperCase())) 
    ? board.toUpperCase() as BoardType 
    : 'CBSE' as BoardType;

  const sSubject = subjectName.trim();
  const sTopic = topicName.trim();

  try {
    // 2. Resolve Curriculum (Board + Grade)
    let curriculum = await prisma.curriculum.findUnique({
      where: { board_grade: { board: dbBoard, grade } }
    });
    if (!curriculum) {
      try {
        curriculum = await prisma.curriculum.create({
          data: { board: dbBoard, grade }
        });
      } catch (e) {
        curriculum = await prisma.curriculum.findUnique({ where: { board_grade: { board: dbBoard, grade } } });
      }
    }

    if (!curriculum) throw new Error("Failed to resolve curriculum container.");

    // 3. Resolve Subject
    let subject = await prisma.subject.findUnique({
      where: { curriculumId_name: { curriculumId: curriculum.id, name: sSubject } }
    });
    if (!subject) {
      try {
        subject = await prisma.subject.create({
          data: { curriculumId: curriculum.id, name: sSubject }
        });
      } catch (e) {
        subject = await prisma.subject.findUnique({ where: { curriculumId_name: { curriculumId: curriculum.id, name: sSubject } } });
      }
    }

    if (!subject) throw new Error("Failed to resolve subject node.");

    // 4. Resolve Chapter (General)
    let chapter = await prisma.chapter.findUnique({
      where: { subjectId_name: { subjectId: subject.id, name: 'General' } }
    });
    if (!chapter) {
      try {
        chapter = await prisma.chapter.create({
          data: { subjectId: subject.id, name: 'General' }
        });
      } catch (e) {
        chapter = await prisma.chapter.findUnique({ where: { subjectId_name: { subjectId: subject.id, name: 'General' } } });
      }
    }

    if (!chapter) throw new Error("Failed to resolve chapter node.");

    // 5. Resolve Topic
    let topic = await prisma.topic.findUnique({
      where: { chapterId_name: { chapterId: chapter.id, name: sTopic } }
    });
    if (!topic) {
      try {
        topic = await prisma.topic.create({
          data: { chapterId: chapter.id, name: sTopic }
        });
      } catch (e) {
        topic = await prisma.topic.findUnique({ where: { chapterId_name: { chapterId: chapter.id, name: sTopic } } });
      }
    }

    return { curriculum, subject, chapter, topic };
  } catch (err: any) {
    console.error("[RESOLVER ERROR]", err.message);
    // Absolute fallback: return mock-like IDs if DB is totally locked
    // This allows AI generation to proceed even if DB persistence fails temporarily
    return {
      curriculum: { id: '00000000-0000-0000-0000-000000000001' },
      subject: { id: '00000000-0000-0000-0000-000000000002' },
      chapter: { id: '00000000-0000-0000-0000-000000000003' },
      topic: { id: '00000000-0000-0000-0000-000000000004' }
    } as any;
  }
}
