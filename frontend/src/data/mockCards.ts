/**
 * Mock card data for consultation games
 * This data will be replaced with actual database queries in the future
 */

export interface CardData {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
}

export interface MockCardsData {
  職游旅人卡: CardData[];
  職能盤點卡: CardData[];
  價值導航卡: CardData[];
}

export const mockCardsData: MockCardsData = {
  職游旅人卡: [
    // 科技類
    {
      id: 'career-1',
      title: '軟體工程師',
      description: '負責軟體開發與維護',
      category: 'technology',
      tags: ['程式', '邏輯'],
    },
    {
      id: 'career-2',
      title: '資料科學家',
      description: '分析大數據並建立模型',
      category: 'technology',
      tags: ['數據', '分析'],
    },
    {
      id: 'career-3',
      title: '網路安全專家',
      description: '保護資訊系統安全',
      category: 'technology',
      tags: ['安全', '防護'],
    },
    {
      id: 'career-4',
      title: 'UI/UX設計師',
      description: '設計使用者介面和體驗',
      category: 'technology',
      tags: ['設計', '美學'],
    },
    {
      id: 'career-5',
      title: '系統管理員',
      description: '維護和管理電腦系統',
      category: 'technology',
      tags: ['維護', '管理'],
    },

    // 醫療類
    {
      id: 'career-6',
      title: '醫生',
      description: '診斷和治療疾病',
      category: 'healthcare',
      tags: ['醫療', '診斷'],
    },
    {
      id: 'career-7',
      title: '護理師',
      description: '提供醫療護理服務',
      category: 'healthcare',
      tags: ['照護', '服務'],
    },
    {
      id: 'career-8',
      title: '藥師',
      description: '配製和管理藥物',
      category: 'healthcare',
      tags: ['藥物', '專業'],
    },
    {
      id: 'career-9',
      title: '物理治療師',
      description: '幫助患者恢復身體功能',
      category: 'healthcare',
      tags: ['復健', '治療'],
    },
    {
      id: 'career-10',
      title: '心理諮商師',
      description: '提供心理健康諮詢',
      category: 'healthcare',
      tags: ['心理', '諮詢'],
    },

    // 教育類
    {
      id: 'career-11',
      title: '小學老師',
      description: '教育小學生基礎知識',
      category: 'education',
      tags: ['教學', '兒童'],
    },
    {
      id: 'career-12',
      title: '中學老師',
      description: '教授中學課程',
      category: 'education',
      tags: ['教育', '青少年'],
    },
    {
      id: 'career-13',
      title: '大學教授',
      description: '進行高等教育和研究',
      category: 'education',
      tags: ['研究', '學術'],
    },
    {
      id: 'career-14',
      title: '幼兒園老師',
      description: '照顧和教育幼兒',
      category: 'education',
      tags: ['幼教', '照顧'],
    },
    {
      id: 'career-15',
      title: '補習班老師',
      description: '提供課外輔導',
      category: 'education',
      tags: ['輔導', '教學'],
    },

    // 更多職業...
    {
      id: 'career-16',
      title: '律師',
      description: '提供法律諮詢和服務',
      category: 'law',
      tags: ['法律', '諮詢'],
    },
    {
      id: 'career-17',
      title: '會計師',
      description: '處理財務和稅務事務',
      category: 'finance',
      tags: ['財務', '稅務'],
    },
    {
      id: 'career-18',
      title: '建築師',
      description: '設計建築物和空間',
      category: 'design',
      tags: ['建築', '空間'],
    },
    {
      id: 'career-19',
      title: '廚師',
      description: '製作美味料理',
      category: 'service',
      tags: ['烹飪', '美食'],
    },
    {
      id: 'career-20',
      title: '記者',
      description: '報導新聞和事件',
      category: 'media',
      tags: ['新聞', '報導'],
    },
  ],
  職能盤點卡: [
    {
      id: 'skill-1',
      title: '溝通協調',
      description: '與他人有效溝通的能力',
      category: 'communication',
      tags: ['溝通', '協調'],
    },
    {
      id: 'skill-2',
      title: '分析思考',
      description: '邏輯分析和批判性思考',
      category: 'analytical',
      tags: ['分析', '邏輯'],
    },
    {
      id: 'skill-3',
      title: '領導管理',
      description: '領導團隊和管理能力',
      category: 'leadership',
      tags: ['領導', '管理'],
    },
    {
      id: 'skill-4',
      title: '創新發想',
      description: '創造性思維和解決問題',
      category: 'creative',
      tags: ['創新', '思維'],
    },
    {
      id: 'skill-5',
      title: '時間管理',
      description: '有效規劃和控制時間',
      category: 'organizational',
      tags: ['時間', '規劃'],
    },
    {
      id: 'skill-6',
      title: '團隊合作',
      description: '與他人協作達成目標',
      category: 'collaboration',
      tags: ['團隊', '合作'],
    },
    {
      id: 'skill-7',
      title: '學習能力',
      description: '快速學習新知識和技能',
      category: 'learning',
      tags: ['學習', '成長'],
    },
    {
      id: 'skill-8',
      title: '抗壓能力',
      description: '在壓力下保持表現',
      category: 'resilience',
      tags: ['抗壓', '韌性'],
    },
    {
      id: 'skill-9',
      title: '適應能力',
      description: '面對變化的調適能力',
      category: 'adaptability',
      tags: ['適應', '彈性'],
    },
    {
      id: 'skill-10',
      title: '解決問題',
      description: '識別和解決各種問題',
      category: 'problem-solving',
      tags: ['解決', '問題'],
    },
  ],
  價值導航卡: [
    {
      id: 'value-1',
      title: '成就感',
      description: '追求個人成就和認可',
      category: 'achievement',
      tags: ['成就', '認可'],
    },
    {
      id: 'value-2',
      title: '穩定性',
      description: '尋求安全和穩定',
      category: 'security',
      tags: ['穩定', '安全'],
    },
    {
      id: 'value-3',
      title: '自主性',
      description: '獨立自主的工作環境',
      category: 'autonomy',
      tags: ['自主', '獨立'],
    },
    {
      id: 'value-4',
      title: '社會貢獻',
      description: '為社會做出貢獻',
      category: 'service',
      tags: ['貢獻', '服務'],
    },
    {
      id: 'value-5',
      title: '創意發揮',
      description: '能夠展現創意和想像力',
      category: 'creativity',
      tags: ['創意', '想像'],
    },
    {
      id: 'value-6',
      title: '工作平衡',
      description: '工作與生活的平衡',
      category: 'balance',
      tags: ['平衡', '生活'],
    },
    {
      id: 'value-7',
      title: '學習成長',
      description: '持續學習和個人發展',
      category: 'growth',
      tags: ['學習', '成長'],
    },
    {
      id: 'value-8',
      title: '人際關係',
      description: '建立良好的人際網絡',
      category: 'relationships',
      tags: ['人際', '關係'],
    },
    {
      id: 'value-9',
      title: '經濟報酬',
      description: '獲得合理的經濟回報',
      category: 'financial',
      tags: ['經濟', '報酬'],
    },
    {
      id: 'value-10',
      title: '地位聲望',
      description: '獲得社會認可和尊重',
      category: 'status',
      tags: ['地位', '聲望'],
    },
  ],
};
