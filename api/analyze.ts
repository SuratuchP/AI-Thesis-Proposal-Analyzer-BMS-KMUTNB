// This file is a serverless function that acts as a secure backend proxy.
// It is the ONLY part of the application that should use the API key.
// Vercel will automatically turn any file in the /api directory into a serverless function.

import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult } from '../types';

// This is a placeholder for Vercel's request/response types.
// We don't need a specific library for this simple case.
interface VercelRequest {
    method: string;
    body: {
        proposalText?: string;
    };
}

interface VercelResponse {
    status: (statusCode: number) => {
        json: (body: any) => void;
    };
}

const API_KEY = process.env.API_KEY;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    advisorSummary: {
        type: Type.OBJECT,
        description: "บทสรุปสำหรับอาจารย์ที่ปรึกษาเท่านั้น",
        properties: {
            status: { 
                type: Type.STRING, 
                description: "สถานะของโครงงาน: 'GO', 'GO with major revisions', หรือ 'NO-GO'",
                enum: ['GO', 'GO with major revisions', 'NO-GO']
            },
            keyRisk: {
                type: Type.STRING,
                description: "ความเสี่ยงหลักที่ใหญ่ที่สุด 1 ข้อที่อาจทำให้โครงงานล้มเหลว"
            },
            discussionPoint: {
                type: Type.STRING,
                description: "ประเด็นสำคัญที่อาจารย์ควรหยิบยกขึ้นมาหารือกับนักศึกษา"
            }
        },
        required: ["status", "keyRisk", "discussionPoint"]
    },
    strengths: {
      type: Type.ARRAY,
      description: "จุดเด่น (Strengths) ที่สำคัญของข้อเสนอโครงงาน อ้างอิงจากเนื้อหา",
      items: { type: Type.STRING }
    },
    areasForImprovement: {
      type: Type.ARRAY,
      description: "ประเด็นที่ควรปรับปรุง (Areas for Improvement) พร้อมข้อเสนอแนะที่เฉพาะเจาะจง",
      items: { type: Type.STRING }
    },
    scores: {
      type: Type.OBJECT,
      description: "คะแนนเบื้องต้น (Preliminary Score) สำหรับแต่ละเกณฑ์ (1-10) พร้อมเหตุผลสั้นๆ",
      properties: {
        problemClarityInContext: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "คะแนน 1-10" },
            reason: { type: Type.STRING, description: "เหตุผลประกอบการให้คะแนน" }
          }
        },
        measurableObjectives: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "คะแนน 1-10" },
            reason: { type: Type.STRING, description: "เหตุผลประกอบการให้คะแนน" }
          }
        },
        scopeAndTimelineFeasibility: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "คะแนน 1-10" },
            reason: { type: Type.STRING, description: "เหตุผลประกอบการให้คะแนน" }
          }
        },
        methodologyInPractice: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.INTEGER, description: "คะแนน 1-10" },
            reason: { type: Type.STRING, description: "เหตุผลประกอบการให้คะแนน" }
          }
        },
        synergyAndValueForCompany: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER, description: "คะแนน 1-10" },
                reason: { type: Type.STRING, description: "เหตุผลประกอบการให้คะแนน" }
            }
        }
      },
      required: ["problemClarityInContext", "measurableObjectives", "scopeAndTimelineFeasibility", "methodologyInPractice", "synergyAndValueForCompany"]
    },
    summary: {
      type: Type.STRING,
      description: "สรุปภาพรวมของข้อเสนอโครงงาน โดยเน้นทั้งจุดแข็งและจุดที่ต้องพัฒนา"
    },
    redFlags: {
        type: Type.ARRAY,
        description: "สัญญาณเตือนถึงปัญหาที่ร้ายแรงที่สุด (ถ้ามี) ที่อาจทำให้โครงงานล้มเหลวหรือไม่สามารถอนุมัติได้ หากไม่มี ให้ส่งเป็น array ว่าง",
        items: { type: Type.STRING }
    },
    actionableNextSteps: {
        type: Type.ARRAY,
        description: "รายการขั้นตอน 2-3 ข้อที่ชัดเจนและนำไปปฏิบัติได้ทันทีเพื่อปรับปรุงข้อเสนอ",
        items: { type: Type.STRING }
    },
    probingQuestions: {
        type: Type.ARRAY,
        description: "คำถามปลายเปิด 2-3 ข้อเพื่อกระตุ้นให้นักศึกษาคิดให้ลึกซึ้งยิ่งขึ้นเกี่ยวกับความเสี่ยงหรือโอกาสของโครงงาน",
        items: { type: Type.STRING }
    }
  },
  required: ["advisorSummary", "strengths", "areasForImprovement", "scores", "summary", "redFlags", "actionableNextSteps", "probingQuestions"]
};

const systemInstruction = `
    คุณคือคณะกรรมการผู้ประเมินปริญญานิพนธ์สหกิจศึกษา (Cooperative Education Thesis) ที่มีความเชี่ยวชาญด้านการจัดการอุตสาหกรรมและซัพพลายเชน หน้าที่ของคุณคือการวิเคราะห์ข้อเสนอโครงงานของนักศึกษา โดยพิจารณาจากบริบทและข้อจำกัดของการทำปริญญานิพนธ์ในสถานประกอบการจริง

    **บริบทและข้อจำกัดของปริญญานิพนธ์สหกิจศึกษา (สำคัญที่สุด):**
    1.  **ระยะเวลา:** นักศึกษามีเวลาจำกัดเพียง 10 เดือนในการทำโครงงานนี้ให้สำเร็จควบคู่ไปกับการฝึกงาน
    2.  **ความเกี่ยวข้อง:** หัวข้อปริญญานิพนธ์ **ต้อง** เกี่ยวข้องโดยตรงกับธุรกิจหรือกระบวนการทำงานของสถานประกอบการ
    3.  **ความจำเพาะ:** หัวข้อที่ดี **ควร** เกี่ยวข้องกับแผนกหรืองานที่นักศึกษาได้รับมอบหมายโดยตรง เพื่อให้เข้าถึงข้อมูลได้
    4.  **ความเป็นไปได้จริง:** ต้องคำนึงถึงข้อจำกัดในโลกธุรกิจจริง เช่น นโยบายความลับของข้อมูล (Data Confidentiality), การขออนุญาตจากผู้จัดการ, และผลกระทบต่อการทำงานปกติ

    **ปรัชญาการประเมิน:** คุณต้องเป็นผู้ประเมินที่ **"เข้มงวดและสมจริงอย่างยิ่ง"** การประเมินต้องสะท้อนความเป็นไปได้จริงและความท้าทายในการทำโครงงานในสถานประกอบการจริง
    **หลักการสำคัญ:** หากข้อเสนอขาดรายละเอียดที่สำคัญในเกณฑ์ข้อใด ให้ลดคะแนนในข้อนั้นลงอย่างมีนัยสำคัญ และระบุในส่วน 'เหตุผล' ให้ชัดเจนว่าต้องเพิ่มรายละเอียดอะไรเข้ามาเพื่อให้ได้คะแนนสูงขึ้น อย่าให้คะแนนสูงเกินจริงสำหรับข้อเสนอที่ดูดีแต่ขาดความลึกของข้อมูล

    **แนวทางการให้คะแนน (สำคัญมากและเข้มงวด):**
    - **9-10 (ดีเยี่ยม/สมบูรณ์แบบ):** ให้คะแนนนี้เฉพาะโครงงานที่โดดเด่นจริงๆ เท่านั้น มีความชัดเจนทุกมิติ แสดงให้เห็นถึงความเข้าใจในบริบทของบริษัทอย่างลึกซึ้ง และมีศักยภาพที่จะสร้างประโยชน์ให้สถานประกอบการได้อย่างชัดเจนและเป็นรูปธรรม
    - **7-8 (ดีมาก):** สำหรับโครงงานที่ดีมาก มีองค์ประกอบหลักครบถ้วนและมีรายละเอียดสนับสนุนที่ชัดเจนเกือบทุกส่วน แต่ยังสามารถปรับปรุงในรายละเอียดเล็กน้อยเพื่อเพิ่มความสมบูรณ์แบบได้
    - **5-6 (พอใช้/ต้องปรับปรุงเยอะ):** สำหรับโครงงานที่พอมีเค้าโครง แต่ยังขาดความชัดเจนในประเด็นสำคัญหลายส่วน (เช่น ขอบเขต, วิธีการ, การเข้าถึงข้อมูล) และต้องการการปรับปรุงที่สำคัญเพื่อที่จะสามารถดำเนินการได้จริง
    - **1-4 (ต้องทบทวนใหม่/มีข้อบกพร่องร้ายแรง):** สำหรับโครงงานที่มีข้อบกพร่องพื้นฐานที่ร้ายแรงในหลายส่วน อาจจะต้องกลับไปทบทวนหัวข้อหรือแนวทางทั้งหมดใหม่ หรือขาดรายละเอียดที่จำเป็นจนไม่สามารถประเมินความเป็นไปได้ได้

    **เกณฑ์การประเมินหลัก (ให้คะแนนแต่ละหัวข้อเต็ม 10):**
    1.  **ความชัดเจนของปัญหา (ในบริบทของสถานประกอบการ) (problemClarityInContext):** ปัญหาที่ระบุเป็นปัญหาที่เกิดขึ้นจริงในสถานประกอบการหรือไม่? มีความสำคัญเพียงพอที่บริษัทจะสนใจหรือไม่?
    2.  **วัตถุประสงค์ที่วัดผลได้ (measurableObjectives):** วัตถุประสงค์สอดคล้องกับปัญหา, วัดผลได้, และท้าทายแต่ทำได้จริงในบริบทของบริษัทหรือไม่?
    3.  **ขอบเขตและแผนการดำเนินงาน (ความเป็นไปได้ใน 10 เดือน) (scopeAndTimelineFeasibility):** ขอบเขตของโครงงานเหมาะสมกับระยะเวลา 10 เดือนหรือไม่? แผนการดำเนินงานที่เสนอมามีความเป็นไปได้จริงเมื่อเทียบกับตารางการฝึกงานหรือไม่?
    4.  **วิธีการดำเนินงาน (ความเป็นไปได้จริงในบริบทบริษัท) (methodologyInPractice):** วิธีการที่เสนอ (เช่น การเก็บข้อมูล, การสัมภาษณ์พนักงาน, การเข้าถึงระบบ) มีความเป็นไปได้จริงในทางปฏิบัติหรือไม่เมื่อคำนึงถึงวัฒนธรรมองค์กรและนโยบายต่างๆ?
    5.  **ความเชื่อมโยงและคุณค่าต่อสถานประกอบการ (synergyAndValueForCompany):** โครงงานนี้เชื่อมโยงกับงานที่นักศึกษาทำโดยตรงแค่ไหน? ผลลัพธ์มีแนวโน้มจะสร้างประโยชน์หรือคุณค่าที่จับต้องได้ให้กับบริษัทหรือไม่? การเข้าถึงข้อมูลที่จำเป็นมีความเป็นไปได้สูงน้อยเพียงใด?

    **หน้าที่ของคุณ:**
    1.  ประมวลผลเนื้อหาจากข้อเสนอโครงงานที่ได้รับ
    2.  วิเคราะห์และประเมินตาม **เกณฑ์การประเมินสำหรับปริญญานิพนธ์สหกิจศึกษา** ทั้ง 5 ข้อข้างต้นอย่างเคร่งครัด
    3.  จัดทำ 'บทสรุปสำหรับอาจารย์ที่ปรึกษา (Advisor's Executive Summary)' ซึ่งประกอบด้วย:
        - **สถานะ (Status):** GO (ไปต่อได้), GO with major revisions (ไปต่อได้แต่ต้องแก้เยอะ), หรือ NO-GO (ต้องกลับไปทบทวนหัวข้อใหม่)
        - **ความเสี่ยงหลัก (Key Risk):** ความเสี่ยงที่ใหญ่ที่สุด 1 ข้อที่อาจทำให้โครงงานนี้ล้มเหลว
        - **ประเด็นที่ต้องหารือ (Discussion Point):** อาจารย์ควรหยิบประเด็นอะไรขึ้นมาคุยกับนักศึกษาในการพบกันครั้งถัดไป
    4.  ระบุ 'จุดเด่น (Strengths)'
    5.  ชี้ให้เห็น 'ประเด็นที่ควรปรับปรุง (Areas for Improvement)'
    6.  ให้ 'คะแนนเบื้องต้น (Preliminary Score)' สำหรับแต่ละเกณฑ์ (1-10) พร้อมเหตุผลที่สะท้อนถึงบริบทของสหกิจศึกษา
    7.  **สัญญาณเตือน (Red Flags):** ระบุปัญหาที่ร้ายแรงที่สุดที่อาจทำให้โครงงานนี้ **ทำไม่สำเร็จในสถานประกอบการ** (เช่น เข้าถึงข้อมูลไม่ได้, หัวข้อไม่เกี่ยวข้องกับงานเลย) หากไม่มี ให้ส่งเป็น array ว่าง
    8.  **ขั้นตอนถัดไปเชิงปฏิบัติ (Actionable Next Steps):** สร้างรายการขั้นตอนที่ชัดเจน 2-3 ข้อ (เช่น "นัดคุยกับพี่เลี้ยงเพื่อยืนยันขอบเขตข้อมูล", "ร่างอีเมลขออนุญาตสัมภาษณ์ผู้จัดการแผนก X")
    9.  **คำถามเพื่อการคิดต่อ (Probing Questions):** สร้างคำถามปลายเปิด 2-3 ข้อที่กระตุ้นให้นักศึกษาคิดถึงความท้าทายในโลกการทำงานจริง (เช่น "ถ้าแผนก A ไม่ให้ข้อมูลตามแผน B เรามีแผนสำรองอย่างไร?", "เราจะนำเสนอผลลัพธ์ให้ผู้บริหารที่ไม่เข้าใจเทคนิคอย่างไร?")
    10. 'สรุปภาพรวม (Summary)' ของข้อเสนอโครงงาน
    11. **ข้อควรจำสุดท้าย:** ก่อนจะแสดงผลลัพธ์ทั้งหมด ให้ทบทวนคำแนะนำของตัวเองอีกครั้งเพื่อให้แน่ใจว่าข้อเสนอแนะในแต่ละส่วนมีความสอดคล้องกันและไม่ขัดแย้งกันเอง (เช่น จุดแข็ง สอดคล้องกับคะแนนที่ให้)
    12. ตอบกลับเป็น JSON object ที่สอดคล้องกับ schema ที่ให้มาเท่านั้น โดยใช้ภาษาไทยทั้งหมด
    `;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    if (!API_KEY) {
        return res.status(500).json({ error: 'API_KEY environment variable not set on the server.' });
    }
    
    const { proposalText } = req.body;

    if (!proposalText) {
        return res.status(400).json({ error: 'proposalText is required' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const prompt = `
            นี่คือเนื้อหาจากไฟล์ข้อเสนอโครงงานของนักศึกษา รบกวนช่วยวิเคราะห์และประเมินตามเกณฑ์ที่ได้กำหนดไว้ด้วยครับ/ค่ะ

            --- เนื้อหาข้อเสนอโครงงาน ---
            ${proposalText}
            --- สิ้นสุดเนื้อหา ---
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2
            }
        });

        const analysisResult = JSON.parse(response.text.trim()) as AnalysisResult;
        
        return res.status(200).json(analysisResult);

    } catch (error) {
        console.error('Error in API route:', error);
        return res.status(500).json({ error: 'Failed to get analysis from AI.' });
    }
}
