
import React, { useState } from 'react';
import { AnalysisResult, CriterionFeedback } from '../types';
import { ScoreRating } from './ScoreRating';
import { 
    ThumbsUpIcon, LightbulbIcon, ClipboardListIcon, BookOpenIcon, 
    CheckCircleIcon, AlertTriangleIcon, WrenchScrewdriverIcon, CheckBadgeIcon,
    FlagIcon, ListBulletIcon, QuestionMarkCircleIcon, BriefcaseIcon,
    ClipboardCopyIcon, EnvelopeIcon
} from './icons';

interface AnalysisResultDisplayProps {
  result: AnalysisResult;
}

const scoreCriteriaLabels: { [key: string]: string } = {
  problemClarityInContext: 'ความชัดเจนของปัญหา (ในบริบทของสถานประกอบการ)',
  measurableObjectives: 'วัตถุประสงค์ที่วัดผลได้',
  scopeAndTimelineFeasibility: 'ขอบเขตและแผนการดำเนินงาน (ความเป็นไปได้ใน 10 เดือน)',
  methodologyInPractice: 'วิธีการดำเนินงาน (ความเป็นไปได้จริงในบริบทบริษัท)',
  synergyAndValueForCompany: 'ความเชื่อมโยงและคุณค่าต่อสถานประกอบการ',
};

const renderContent = (content: any) => {
    if (typeof content === 'object' && content !== null) {
        if (content.reason && typeof content.score !== 'undefined') {
            return `(ข้อมูลผิดรูปแบบ: ${content.reason} - ${content.score} คะแนน)`;
        }
        return JSON.stringify(content);
    }
    return content;
};

// Helper function to format the entire result for chat apps
const formatForChat = (result: AnalysisResult, totalScore: number, maxScore: number): string => {
    const percentage = ((totalScore / maxScore) * 100).toFixed(0);
    const recommendationText = parseInt(percentage) >= 50
        ? "ผลการประเมินเบื้องต้นอยู่ในเกณฑ์ดี แนะนำให้ดำเนินการโครงงานนี้ต่อได้"
        : "ผลการประเมินเบื้องต้นยังต่ำกว่าเกณฑ์ที่แนะนำ ควรพิจารณาปรับปรุงประเด็นต่างๆ อย่างละเอียด";

    let chatText = `*📊 สรุปผลการประเมินโครงงาน 📊*\n\n`;

    // Advisor Summary
    chatText += `*📝 บทสรุปสำหรับอาจารย์*\n`;
    chatText += `*สถานะ:* ${result.advisorSummary.status}\n`;
    chatText += `*ความเสี่ยงหลัก:* ${result.advisorSummary.keyRisk}\n`;
    chatText += `*ประเด็นที่ต้องหารือ:* ${result.advisorSummary.discussionPoint}\n\n`;
    
    // Overall Recommendation
    chatText += `*⭐ ข้อเสนอแนะในการดำเนินการต่อ*\n`;
    chatText += `*คะแนนรวม:* ${totalScore} / ${maxScore} (${percentage}%)\n`;
    chatText += `*คำแนะนำ:* ${recommendationText}\n\n`;
    
    // Red Flags
    if (result.redFlags && result.redFlags.length > 0) {
        chatText += `*🚩 สัญญาณเตือน (Red Flags)*\n`;
        result.redFlags.forEach(flag => {
            chatText += `- ${flag}\n`;
        });
        chatText += `\n`;
    }

    // Strengths
    if (result.strengths && result.strengths.length > 0) {
        chatText += `*👍 จุดเด่น (Strengths)*\n`;
        result.strengths.forEach(strength => {
            chatText += `- ${strength}\n`;
        });
        chatText += `\n`;
    }

    // Areas for Improvement
    if (result.areasForImprovement && result.areasForImprovement.length > 0) {
        chatText += `*💡 ประเด็นที่ควรปรับปรุง*\n`;
        result.areasForImprovement.forEach(area => {
            chatText += `- ${area}\n`;
        });
        chatText += `\n`;
    }
    
    // Actionable Next Steps
    if (result.actionableNextSteps && result.actionableNextSteps.length > 0) {
        chatText += `*🚀 ขั้นตอนถัดไปเชิงปฏิบัติ*\n`;
        result.actionableNextSteps.forEach(step => {
            chatText += `- ${step}\n`;
        });
        chatText += `\n`;
    }

    // Probing Questions
    if (result.probingQuestions && result.probingQuestions.length > 0) {
        chatText += `*❓ คำถามเพื่อการคิดต่อ*\n`;
        result.probingQuestions.forEach(question => {
            chatText += `- _${question}_\n`;
        });
        chatText += `\n`;
    }

    // Scores Table
    chatText += `*📋 ตารางคะแนน*\n`;
    (Object.entries(result.scores) as [string, CriterionFeedback][]).forEach(([key, feedback]) => {
        chatText += `*${scoreCriteriaLabels[key] || key}:* ${feedback.score}/10\n`;
        chatText += `_${feedback.reason}_\n\n`;
    });

    // Overall Summary
    chatText += `*📖 สรุปภาพรวม*\n`;
    chatText += `${result.summary}\n`;

    return chatText.trim();
};

// Helper function to format the entire result as plain text for email body
const formatForPlainTextEmail = (result: AnalysisResult, totalScore: number, maxScore: number): string => {
    const percentage = ((totalScore / maxScore) * 100).toFixed(0);
    const recommendationText = parseInt(percentage) >= 50
        ? "ผลการประเมินเบื้องต้นอยู่ในเกณฑ์ดี (มากกว่า 50%) แนะนำให้ดำเนินการโครงงานนี้ต่อได้ โดยนำประเด็นที่ต้องปรับปรุงไปพิจารณาเพิ่มเติมเพื่อความสมบูรณ์ของโครงงาน"
        : "ผลการประเมินเบื้องต้นยังต่ำกว่าเกณฑ์ที่แนะนำ (น้อยกว่า 50%) ควรพิจารณาปรับปรุงประเด็นต่างๆ ที่ได้รับข้อเสนอแนะอย่างละเอียดก่อนตัดสินใจดำเนินการต่อ เพื่อเพิ่มโอกาสในการสำเร็จของโครงงาน";

    let emailText = `เรียน นักศึกษา,\n\nนี่คือผลการวิเคราะห์ข้อเสนอโครงงานของคุณจากผู้ช่วยสอน AI ครับ/ค่ะ\n\n`;
    emailText += "========================================\n";
    emailText += "บทสรุปสำหรับอาจารย์ที่ปรึกษา (เพื่ออ้างอิง)\n";
    emailText += "========================================\n";
    emailText += `สถานะ: ${result.advisorSummary.status}\n`;
    emailText += `ความเสี่ยงหลัก: ${result.advisorSummary.keyRisk}\n`;
    emailText += `ประเด็นที่ต้องหารือ: ${result.advisorSummary.discussionPoint}\n\n`;

    emailText += "========================================\n";
    emailText += "ข้อเสนอแนะและผลการประเมินโดยละเอียด\n";
    emailText += "========================================\n\n";
    
    emailText += `ข้อเสนอแนะในการดำเนินการต่อ\n`;
    emailText += `คะแนนรวม: ${totalScore} / ${maxScore} (${percentage}%)\n`;
    emailText += `คำแนะนำ: ${recommendationText}\n\n`;

    if (result.redFlags && result.redFlags.length > 0) {
        emailText += `--- สัญญาณเตือน (Red Flags) ---\n`;
        result.redFlags.forEach(flag => { emailText += `- ${flag}\n`; });
        emailText += `\n`;
    }

    if (result.strengths && result.strengths.length > 0) {
        emailText += `--- จุดเด่น (Strengths) ---\n`;
        result.strengths.forEach(s => { emailText += `- ${s}\n`; });
        emailText += `\n`;
    }

    if (result.areasForImprovement && result.areasForImprovement.length > 0) {
        emailText += `--- ประเด็นที่ควรปรับปรุง ---\n`;
        result.areasForImprovement.forEach(a => { emailText += `- ${a}\n`; });
        emailText += `\n`;
    }

    if (result.actionableNextSteps && result.actionableNextSteps.length > 0) {
        emailText += `--- ขั้นตอนถัดไปเชิงปฏิบัติ ---\n`;
        result.actionableNextSteps.forEach(s => { emailText += `- ${s}\n`; });
        emailText += `\n`;
    }

    if (result.probingQuestions && result.probingQuestions.length > 0) {
        emailText += `--- คำถามเพื่อการคิดต่อ ---\n`;
        result.probingQuestions.forEach(q => { emailText += `- ${q}\n`; });
        emailText += `\n`;
    }

    emailText += `--- ตารางคะแนนเบื้องต้น ---\n`;
    (Object.entries(result.scores) as [string, CriterionFeedback][]).forEach(([key, feedback]) => {
        emailText += `เกณฑ์: ${scoreCriteriaLabels[key] || key}\n`;
        emailText += `คะแนน: ${feedback.score}/10\n`;
        emailText += `เหตุผล: ${feedback.reason}\n\n`;
    });

    emailText += `--- สรุปภาพรวม ---\n`;
    emailText += `${result.summary}\n\n`;

    emailText += "========================================\n\n";
    emailText += `ขอให้นำข้อเสนอแนะเหล่านี้ไปปรับปรุงโครงงานต่อไป\n\n`;
    emailText += `ด้วยความปรารถนาดี,\nผู้ช่วยสอน AI`;
    
    return emailText;
};


const ResultSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, icon, children, className = '' }) => (
    <div className={`bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-8 ${className}`}>
        <div className="flex items-center mb-4">
            {icon}
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 ml-3">{title}</h3>
        </div>
        <div className="space-y-4 text-gray-700 text-lg">
            {children}
        </div>
    </div>
);

const AdvisorSummarySection: React.FC<{ 
    summary: AnalysisResult['advisorSummary']; 
    onCopy: () => void; 
    onEmail: () => void; 
    isCopied: boolean;
}> = ({ summary, onCopy, onEmail, isCopied }) => {
    const statusStyles = {
        'GO': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-400' },
        'GO with major revisions': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-400' },
        'NO-GO': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-400' },
    };
    const currentStyle = statusStyles[summary.status] || statusStyles['GO with major revisions'];

    return (
        <div className={`p-6 rounded-xl shadow-lg border-2 ${currentStyle.bg} ${currentStyle.border} mb-8`}>
            <div className="flex items-center mb-4">
                <BriefcaseIcon className={`h-8 w-8 ${currentStyle.text}`} />
                <h3 className={`text-2xl sm:text-3xl font-bold ${currentStyle.text} ml-3`}>บทสรุปสำหรับอาจารย์ที่ปรึกษา</h3>
            </div>
            <div className={`space-y-4 ${currentStyle.text} text-lg`}>
                <div>
                    <p className="font-semibold text-base uppercase tracking-wide">สถานะ</p>
                    <p className="text-3xl font-bold">{summary.status}</p>
                </div>
                <div>
                    <p className="font-semibold text-base uppercase tracking-wide">ความเสี่ยงหลัก (Key Risk)</p>
                    <p>{summary.keyRisk}</p>
                </div>
                <div>
                    <p className="font-semibold text-base uppercase tracking-wide">ประเด็นที่ต้องหารือ</p>
                    <p>{summary.discussionPoint}</p>
                </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-300/50 flex flex-col sm:flex-row gap-3">
                <button onClick={onCopy} className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all">
                    <ClipboardCopyIcon className="w-5 h-5 mr-2" />
                    {isCopied ? 'คัดลอกแล้ว!' : 'คัดลอกสำหรับ LINE'}
                </button>
                 <button onClick={onEmail} className="flex-1 inline-flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all">
                    <EnvelopeIcon className="w-5 h-5 mr-2" />
                    ส่งอีเมล
                </button>
            </div>
        </div>
    );
};


const RedFlagsSection: React.FC<{ flags: string[] }> = ({ flags }) => {
    if (!flags || flags.length === 0) {
        return null;
    }
    return (
        <div className="bg-red-50 p-6 rounded-xl shadow-lg border-2 border-red-400 mb-8">
            <div className="flex items-center mb-4">
                <FlagIcon className="h-8 w-8 text-red-600" />
                <h3 className="text-2xl sm:text-3xl font-bold text-red-800 ml-3">สัญญาณเตือน (Red Flags)</h3>
            </div>
            <div className="space-y-3 text-red-800 text-lg">
                <p className="font-semibold">ตรวจพบประเด็นร้ายแรงที่ต้องได้รับการแก้ไขอย่างเร่งด่วน:</p>
                <ul className="list-none space-y-4">
                    {flags.map((flag, index) => (
                        <li key={index} className="flex items-start">
                             <AlertTriangleIcon className="text-red-600 mt-1 mr-3 flex-shrink-0 w-5 h-5"/>
                            <span>{renderContent(flag)}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const RecommendationSection: React.FC<{ totalScore: number; maxScore: number }> = ({ totalScore, maxScore }) => {
    const percentage = (totalScore / maxScore) * 100;
    const shouldProceed = percentage >= 50;

    const bgColor = shouldProceed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200';
    const textColor = shouldProceed ? 'text-green-800' : 'text-yellow-800';
    const iconColor = shouldProceed ? 'text-green-500' : 'text-yellow-500';

    return (
        <ResultSection title="ข้อเสนอแนะในการดำเนินการต่อ" icon={<WrenchScrewdriverIcon />}>
            <div className={`p-4 rounded-lg border ${bgColor} ${textColor}`}>
                <div className="flex items-start">
                    <CheckBadgeIcon className={`flex-shrink-0 w-8 h-8 mr-4 ${iconColor}`} />
                    <div>
                        <p className="font-bold text-xl">
                            คะแนนรวม: <span className="text-3xl font-black">{totalScore}</span> / {maxScore} ({percentage.toFixed(0)}%)
                        </p>
                        <p className="mt-1 text-lg">
                            {shouldProceed 
                                ? "ผลการประเมินเบื้องต้นอยู่ในเกณฑ์ดี (มากกว่า 50%) แนะนำให้ดำเนินการโครงงานนี้ต่อได้ โดยนำประเด็นที่ต้องปรับปรุงไปพิจารณาเพิ่มเติมเพื่อความสมบูรณ์ของโครงงาน"
                                : "ผลการประเมินเบื้องต้นยังต่ำกว่าเกณฑ์ที่แนะนำ (น้อยกว่า 50%) ควรพิจารณาปรับปรุงประเด็นต่างๆ ที่ได้รับข้อเสนอแนะอย่างละเอียดก่อนตัดสินใจดำเนินการต่อ เพื่อเพิ่มโอกาสในการสำเร็จของโครงงาน"
                            }
                        </p>
                    </div>
                </div>
            </div>
        </ResultSection>
    );
};

export const AnalysisResultDisplay: React.FC<AnalysisResultDisplayProps> = ({ result }) => {
  const [isCopied, setIsCopied] = useState(false);
  const totalScore = Object.values(result.scores).reduce((sum, { score }) => sum + score, 0);
  const maxTotalScore = Object.keys(result.scores).length * 10;

  const handleCopyToClipboard = () => {
    const textForChat = formatForChat(result, totalScore, maxTotalScore);
    navigator.clipboard.writeText(textForChat)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
        alert('ไม่สามารถคัดลอกข้อความได้');
      });
  };
  
  const handleSendEmail = () => {
     const subject = `ผลการวิเคราะห์ข้อเสนอโครงงานสหกิจศึกษา`;
     const plainTextBody = formatForPlainTextEmail(result, totalScore, maxTotalScore);
     
     navigator.clipboard.writeText(plainTextBody)
      .then(() => {
        alert("เนื้อหาอีเมลทั้งหมดถูกคัดลอกแล้ว! กรุณาวาง (Paste) ในหน้าต่างอีเมลที่กำลังจะเปิดขึ้น");
        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}`;
      })
      .catch(err => {
        console.error('Failed to copy email body: ', err);
        alert('ไม่สามารถคัดลอกเนื้อหาอีเมลได้');
      });
  };
  
  return (
    <div className="animate-fade-in">
        <AdvisorSummarySection summary={result.advisorSummary} onCopy={handleCopyToClipboard} onEmail={handleSendEmail} isCopied={isCopied} />

        <RedFlagsSection flags={result.redFlags} />

        <RecommendationSection totalScore={totalScore} maxScore={maxTotalScore} />

        <ResultSection title="จุดเด่น (Strengths)" icon={<ThumbsUpIcon />}>
            <ul className="list-none space-y-4">
                {result.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                        <CheckCircleIcon className="text-green-500 mt-1 mr-3 flex-shrink-0 w-5 h-5"/>
                        <span>{renderContent(strength)}</span>
                    </li>
                ))}
            </ul>
        </ResultSection>

        <ResultSection title="ประเด็นที่ควรปรับปรุง (Areas for Improvement)" icon={<LightbulbIcon />}>
            <ul className="list-none space-y-4">
                {result.areasForImprovement.map((area, index) => (
                    <li key={index} className="flex items-start">
                         <AlertTriangleIcon className="text-yellow-500 mt-1 mr-3 flex-shrink-0 w-5 h-5"/>
                        <span>{renderContent(area)}</span>
                    </li>
                ))}
            </ul>
        </ResultSection>
        
        <ResultSection title="ขั้นตอนถัดไปเชิงปฏิบัติ (Actionable Next Steps)" icon={<ListBulletIcon />}>
             <ul className="list-none space-y-4">
                {result.actionableNextSteps.map((step, index) => (
                    <li key={index} className="flex items-start">
                        <span className="font-bold text-primary-700 mr-3">{index + 1}.</span>
                        <span>{renderContent(step)}</span>
                    </li>
                ))}
            </ul>
        </ResultSection>

        <ResultSection title="คำถามเพื่อการคิดต่อ (Probing Questions)" icon={<QuestionMarkCircleIcon />}>
             <ul className="list-none space-y-4">
                {result.probingQuestions.map((question, index) => (
                    <li key={index} className="flex items-start">
                         <QuestionMarkCircleIcon className="text-primary-600 mt-1 mr-3 flex-shrink-0 w-5 h-5"/>
                        <span className="italic">{renderContent(question)}</span>
                    </li>
                ))}
            </ul>
        </ResultSection>


        <ResultSection title="คะแนนเบื้องต้น (Preliminary Score)" icon={<ClipboardListIcon />}>
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="border-b-2 border-gray-200">
                        <tr>
                            <th className="p-2 sm:p-4 text-base font-semibold text-gray-600 uppercase tracking-wider">เกณฑ์การประเมิน</th>
                            <th className="p-2 sm:p-4 text-base font-semibold text-gray-600 uppercase tracking-wider text-center">คะแนน</th>
                            <th className="p-2 sm:p-4 text-base font-semibold text-gray-600 uppercase tracking-wider">เหตุผล</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(Object.entries(result.scores) as [string, CriterionFeedback][]).map(([key, feedback]) => (
                            <tr key={key} className="border-b border-gray-100 last:border-b-0">
                                <td className="p-2 sm:p-4 font-medium text-gray-800 align-top text-lg">{scoreCriteriaLabels[key] || key}</td>
                                <td className="p-2 sm:p-4 align-top">
                                    <div className="flex flex-col items-center justify-center">
                                        <ScoreRating score={feedback.score} />
                                        <span className="mt-1 text-base font-bold text-primary-700">{feedback.score}/10</span>
                                    </div>
                                </td>
                                <td className="p-2 sm:p-4 text-gray-600 align-top text-lg">
                                    <p className="italic">"{feedback.reason}"</p>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ResultSection>

        <ResultSection title="สรุปภาพรวม (Overall Summary)" icon={<BookOpenIcon />}>
            <p className="leading-relaxed text-lg">{renderContent(result.summary)}</p>
        </ResultSection>
    </div>
  );
};
