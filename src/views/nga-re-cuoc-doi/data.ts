/* ========================================
   DỮ LIỆU GAME - NGÃ RẼ CUỘC ĐỜI
   ======================================== */

export interface Stats {
    money: number;
    skill: number;
    happiness: number;
    stress: number;
    health: number;
    relationships: number;
    [key: string]: number;
}

export interface CareerLevel {
    title: string;
    minSkill: number;
    salary: number;
}

export interface Career {
    id: string;
    name: string;
    emoji: string;
    description: string;
    startStats: Stats;
    salary: number;
    levels: CareerLevel[];
}

export interface Choice {
    text: string;
    icon?: string;
    hint?: string;
    effects: Partial<Record<keyof Stats, number | [number, number]>>;
    result: string | null;
    isGameOver?: boolean;
    gameOverReason?: {
        type: string;
        message: string;
        icon: string;
    };
}

export interface GameEvent {
    id: string;
    type: string;
    title: string;
    description: string;
    minAge?: number;
    maxAge?: number;
    weight?: number;
    oneTime?: boolean;
    choices: Choice[];
    condition?: (s: Stats) => boolean;
    triggerAge?: number;
}

export interface EngineRef {
    state: GameState | null;
}

export interface Achievement {
    id: string;
    title: string;
    emoji: string;
    description: string;
    condition: (s: Stats, engine: EngineRef) => boolean;
}

export interface PassiveItem {
    id: string;
    name: string;
    description: string;
    cost: number;
    effect?: Partial<Stats>;
    category: string;
    unlockAge: number;
    immunity?: string[];
}

export interface ActiveSkill {
    id: string;
    name: string;
    description: string;
    cost: number;
    cooldown: number;
    category: string;
    unlockAge: number;
    effect: string;
}

export interface HistoryEntry {
    age: number;
    year: number;
    text: string;
}

export interface GameState {
    name: string;
    careerId: string;
    careerName: string;
    careerEmoji: string;
    age: number;
    year: number;
    stats: Stats;
    history: HistoryEntry[];
    currentLevel: string;
    salary: number;
    achievements: { age: number, text: string }[];
    unlockedAchievements: string[];
    inventory: string[];
    activeSkills: string[];
    skillCooldowns: Record<string, number>;
    activeBuffs: { type: string, duration: number }[];
    gameOver: boolean;
}

export const CAREERS: Record<string, Career> = {
    programmer: {
        id: 'programmer',
        name: 'Lập Trình Viên',
        emoji: '💻',
        description: 'Phát triển phần mềm, ứng dụng web và di động. Thu nhập tốt nhưng áp lực cao.',
        startStats: {
            money: 45,
            skill: 35,
            happiness: 60,
            stress: 35,
            health: 75,
            relationships: 35
        },
        salary: 15, // triệu/tháng
        levels: [
            { title: 'Junior Developer', minSkill: 0, salary: 15 },
            { title: 'Mid-level Developer', minSkill: 30, salary: 25 },
            { title: 'Senior Developer', minSkill: 55, salary: 40 },
            { title: 'Tech Lead', minSkill: 70, salary: 55 },
            { title: 'Engineering Manager', minSkill: 85, salary: 70 },
            { title: 'CTO', minSkill: 95, salary: 100 }
        ]
    },
    business: {
        id: 'business',
        name: 'Kinh Doanh',
        emoji: '📊',
        description: 'Bán hàng, phát triển thị trường, xây dựng mối quan hệ. Cơ hội kiếm nhiều tiền.',
        startStats: {
            money: 40,
            skill: 25,
            happiness: 65,
            stress: 30,
            health: 80,
            relationships: 55
        },
        salary: 12,
        levels: [
            { title: 'Nhân viên kinh doanh', minSkill: 0, salary: 12 },
            { title: 'Trưởng nhóm bán hàng', minSkill: 30, salary: 22 },
            { title: 'Giám đốc kinh doanh', minSkill: 55, salary: 45 },
            { title: 'Phó TGĐ kinh doanh', minSkill: 75, salary: 65 },
            { title: 'CEO', minSkill: 90, salary: 90 }
        ]
    },
    design: {
        id: 'design',
        name: 'Thiết Kế',
        emoji: '🎨',
        description: 'Sáng tạo giao diện, thương hiệu và trải nghiệm người dùng. Công việc đòi hỏi thẩm mỹ.',
        startStats: {
            money: 35,
            skill: 30,
            happiness: 75,
            stress: 20,
            health: 80,
            relationships: 45
        },
        salary: 13,
        levels: [
            { title: 'Junior Designer', minSkill: 0, salary: 13 },
            { title: 'UI/UX Designer', minSkill: 30, salary: 22 },
            { title: 'Senior Designer', minSkill: 55, salary: 35 },
            { title: 'Art Director', minSkill: 75, salary: 50 },
            { title: 'Creative Director', minSkill: 90, salary: 70 }
        ]
    },
    media: {
        id: 'media',
        name: 'Truyền Thông',
        emoji: '📰',
        description: 'Sản xuất nội dung, quản lý truyền thông xã hội. Sáng tạo và năng động.',
        startStats: {
            money: 30,
            skill: 25,
            happiness: 70,
            stress: 25,
            health: 80,
            relationships: 60
        },
        salary: 10,
        levels: [
            { title: 'Content Creator', minSkill: 0, salary: 10 },
            { title: 'Social Media Manager', minSkill: 30, salary: 18 },
            { title: 'Marketing Manager', minSkill: 55, salary: 35 },
            { title: 'Head of Marketing', minSkill: 75, salary: 50 },
            { title: 'CMO', minSkill: 90, salary: 70 }
        ]
    },
    medical: {
        id: 'medical',
        name: 'Y Tế',
        emoji: '🏥',
        description: 'Chăm sóc sức khỏe cộng đồng. Ổn định nhưng đòi hỏi kiên trì và lòng tận tâm.',
        startStats: {
            money: 35,
            skill: 40,
            happiness: 55,
            stress: 40,
            health: 70,
            relationships: 40
        },
        salary: 14,
        levels: [
            { title: 'Bác sĩ thực tập', minSkill: 0, salary: 14 },
            { title: 'Bác sĩ nội trú', minSkill: 30, salary: 25 },
            { title: 'Bác sĩ chuyên khoa', minSkill: 55, salary: 45 },
            { title: 'Trưởng khoa', minSkill: 75, salary: 60 },
            { title: 'Giám đốc bệnh viện', minSkill: 90, salary: 80 }
        ]
    },
    education: {
        id: 'education',
        name: 'Giáo Dục',
        emoji: '📚',
        description: 'Giảng dạy, nghiên cứu và truyền cảm hứng. Ổn định, ý nghĩa nhưng thu nhập khiêm tốn.',
        startStats: {
            money: 25,
            skill: 35,
            happiness: 70,
            stress: 20,
            health: 85,
            relationships: 55
        },
        salary: 9,
        levels: [
            { title: 'Giáo viên', minSkill: 0, salary: 9 },
            { title: 'Giáo viên giỏi', minSkill: 30, salary: 15 },
            { title: 'Phó Hiệu trưởng', minSkill: 55, salary: 25 },
            { title: 'Hiệu trưởng', minSkill: 75, salary: 40 },
            { title: 'Giáo sư / Chuyên gia', minSkill: 90, salary: 55 }
        ]
    }
};

export const COMMON_EVENTS: GameEvent[] = [
    {
        id: 'life_friend_invite', type: '🎉 Cuộc sống', title: 'Lời mời du lịch',
        description: 'Bạn bè rủ bạn đi du lịch cuối tuần. Chi phí khoảng 5 triệu nhưng hứa hẹn rất vui.',
        minAge: 22, maxAge: 60, weight: 8,
        choices: [
            { text: 'Đi chơi thôi!', icon: '✈️', hint: 'Tốn tiền nhưng vui', effects: { money: -8, happiness: 12, stress: -10, relationships: 8, health: 3 }, result: 'Chuyến đi tuyệt vời, tràn đầy kỷ niệm!' },
            { text: 'Từ chối, cần tiết kiệm', icon: '💰', hint: 'Giữ tiền nhưng hơi tiếc', effects: { happiness: -5, stress: 3, relationships: -5 }, result: 'Bạn ở nhà và hơi tiếc khi thấy ảnh bạn bè.' }
        ]
    },
    {
        id: 'life_health_check', type: '❤️ Sức khỏe', title: 'Kiểm tra sức khỏe',
        description: 'Đã lâu bạn chưa đi khám tổng quát. Gần đây bạn cảm thấy hơi mệt.',
        minAge: 24, maxAge: 60, weight: 7,
        choices: [
            { text: 'Đi khám ngay', icon: '🏥', hint: 'Tốn chút tiền nhưng an tâm', effects: { money: -5, health: 10, stress: -5 }, result: 'Bác sĩ nói cần nghỉ ngơi nhiều hơn. Ít nhất bạn biết mình ổn.' },
            { text: 'Bận quá, để sau', icon: '⏰', hint: 'Tiết kiệm thời gian nhưng rủi ro', effects: { health: -8, stress: 5 }, result: 'Bạn tiếp tục bận rộn và bỏ qua sức khỏe...' }
        ]
    },
    {
        id: 'life_invest', type: '💹 Tài chính', title: 'Cơ hội đầu tư',
        description: 'Bạn bè giới thiệu cơ hội đầu tư chứng khoán. Có thể lãi lớn hoặc mất trắng.',
        minAge: 24, maxAge: 55, weight: 6,
        choices: [
            { text: 'Đầu tư mạnh tay', icon: '📈', hint: 'Rủi ro cao', effects: { money: [-20, 30], stress: 10 }, result: null },
            { text: 'Đầu tư ít thôi', icon: '🤏', hint: 'Rủi ro thấp', effects: { money: [-5, 10], stress: 3 }, result: null },
            { text: 'Không đầu tư', icon: '🚫', hint: 'An toàn', effects: { stress: -2 }, result: 'Bạn quyết định không mạo hiểm.' }
        ]
    },
    {
        id: 'life_relationship', type: '💕 Tình cảm', title: 'Người đặc biệt',
        description: 'Bạn gặp một người rất hợp nhau. Cảm giác này khác lạ.',
        minAge: 23, maxAge: 40, weight: 5, oneTime: true,
        choices: [
            { text: 'Tỏ tình luôn', icon: '💘', hint: 'Can đảm', effects: { happiness: [5, 20], relationships: 15, stress: [-5, 8] }, result: null },
            { text: 'Từ từ tìm hiểu', icon: '☕', hint: 'An toàn hơn', effects: { happiness: 8, relationships: 10 }, result: 'Mối quan hệ dần sâu sắc hơn.' },
            { text: 'Tập trung sự nghiệp', icon: '💼', hint: 'Không mất thời gian', effects: { skill: 5, happiness: -5, relationships: -3 }, result: 'Bạn tập trung 100% vào công việc.' }
        ]
    },
    {
        id: 'life_learn', type: '📖 Học tập', title: 'Khóa học mới',
        description: 'Có khóa học online rất hay. Mất 3 tháng và khoảng 3 triệu.',
        minAge: 22, maxAge: 50, weight: 9,
        choices: [
            { text: 'Đăng ký học ngay', icon: '📚', hint: 'Nâng cao kỹ năng', effects: { money: -5, skill: 12, happiness: 5, stress: 5 }, result: 'Bạn hoàn thành khóa học và tự tin hơn!' },
            { text: 'Tự học trên YouTube', icon: '📱', hint: 'Miễn phí', effects: { skill: 5, happiness: 2 }, result: 'Tự học được kha khá.' },
            { text: 'Chưa cần thiết', icon: '😴', hint: 'Giữ nguyên', effects: {}, result: 'Bạn quyết định chưa cần học thêm.' }
        ]
    }
];

export const CAREER_EVENTS: Record<string, GameEvent[]> = {
    programmer: [
        {
            id: 'prog_deadline', type: '💻 Công việc', title: 'Deadline gấp',
            description: 'Dự án cần hoàn thành trong 1 tuần. Sếp yêu cầu tăng ca liên tục.',
            weight: 8,
            choices: [
                { text: 'Tăng ca hết sức', icon: '🔥', hint: 'Hoàn thành nhưng kiệt sức', effects: { skill: 8, money: 5, stress: 15, health: -8 }, result: 'Dự án hoàn thành! Nhưng bạn kiệt sức.' },
                { text: 'Làm vừa đủ giờ', icon: '⏰', hint: 'Giữ sức khỏe', effects: { skill: 3, stress: 5 }, result: 'Làm được phần lớn, phần còn lại xin thêm thời gian.' },
                { text: 'Đề xuất hoãn deadline', icon: '📋', hint: 'Hợp lý nhưng sếp có thể không vui', effects: { skill: 2, stress: -3, relationships: [-5, 3] }, result: null }
            ]
        },
        {
            id: 'prog_newtech', type: '🧪 Công nghệ', title: 'Công nghệ mới',
            description: 'Có framework/ngôn ngữ mới đang hot. Học sẽ mất thời gian nhưng có lợi dài hạn.',
            weight: 7,
            choices: [
                { text: 'Học ngay!', icon: '📚', hint: 'Đầu tư cho tương lai', effects: { skill: 12, stress: 8, happiness: 5 }, result: 'Bạn nắm vững công nghệ mới, rất có giá trị!' },
                { text: 'Để sau', icon: '😴', hint: 'Thoải mái', effects: { skill: -2 }, result: 'Đồng nghiệp đã đi trước bạn...' }
            ]
        }
    ],
    business: [],
    design: [],
    media: [],
    medical: [],
    education: []
};

export const DANGEROUS_EVENTS: GameEvent[] = [
    {
        id: 'danger_scam_investment',
        type: '⚠️ Nguy hiểm',
        title: 'Cơ hội đầu tư "chắc thắng"',
        description: 'Một người bạn cũ liên lạc, giới thiệu cơ hội đầu tư vào dự án "sinh lời 300% trong 6 tháng". Họ khẳng định đã kiếm được rất nhiều tiền.',
        minAge: 25,
        maxAge: 50,
        weight: 2,
        oneTime: true,
        condition: (s: Stats) => s.money >= 30, // Chỉ xuất hiện khi có tiền
        choices: [
            {
                text: 'Đầu tư toàn bộ tiền tiết kiệm!',
                icon: '💸',
                hint: 'Rủi ro cực cao',
                effects: { money: -50, stress: 30, happiness: -20 },
                result: 'Đó là lừa đảo! Bạn mất sạch tiền tiết kiệm.',
                isGameOver: true,
                gameOverReason: {
                    type: 'bankruptcy',
                    message: 'Phá sản do bị lừa đảo đầu tư',
                    icon: '💔'
                }
            },
            {
                text: 'Thử với số tiền nhỏ',
                icon: '🤔',
                hint: 'Thận trọng',
                effects: { money: -15, stress: 10, skill: 5 },
                result: 'May mắn chỉ mất ít tiền. Bạn học được bài học đắt giá về lừa đảo.'
            }
        ]
    }
];

export const MILESTONE_EVENTS: GameEvent[] = [
    {
        id: 'ms_30', triggerAge: 30, type: '🎂 Cột mốc', title: 'Tuổi 30 - Nhìn lại',
        description: 'Bước sang tuổi 30. Nhìn lại và định hướng tương lai.',
        choices: [
            { text: 'Hài lòng, tiếp tục', icon: '😊', hint: 'Giữ vững', effects: { happiness: 10, skill: 5 }, result: 'Tự tin về con đường đã chọn!' },
            { text: 'Phải thay đổi mạnh!', icon: '🔥', hint: 'Quyết tâm', effects: { stress: 10, skill: 8, happiness: -3 }, result: 'Quyết tâm thay đổi!' }
        ]
    }
];

export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'rich_30',
        title: 'Triệu phú tuổi 30',
        emoji: '💎',
        description: 'Đạt tài chính 80 trước tuổi 30',
        condition: (s: Stats, engine: EngineRef) => engine.state !== null && engine.state.age <= 30 && s.money >= 80
    },
    {
        id: 'workaholic',
        title: 'Kẻ cuồng việc',
        emoji: '🧠',
        description: 'Đạt kỹ năng 90',
        condition: (s: Stats) => s.skill >= 90
    }
];

export const PASSIVE_ITEMS: PassiveItem[] = [
    {
        id: 'book_learning',
        name: '📚 Sách Tự học',
        description: 'Bộ sách kinh điển giúp bạn học hỏi mỗi ngày.',
        cost: 25,
        effect: { skill: 2 }, // Mỗi năm +2 Skill
        category: 'education',
        unlockAge: 22
    },
    {
        id: 'gym_membership',
        name: '🏋️ Thẻ Gym trọn đời',
        description: 'Tập luyện thường xuyên giúp giảm căng thẳng.',
        cost: 30,
        effect: { stress: -3, health: 1 }, // Mỗi năm -3 Stress, +1 Health
        category: 'health',
        unlockAge: 22
    }
];

export const ACTIVE_SKILLS: ActiveSkill[] = [
    {
        id: 'skill_foresight',
        name: '🔮 Nhìn trước tương lai',
        description: 'Xem trước sự kiện tiếp theo và các lựa chọn của nó.',
        cost: 40,
        cooldown: 5,
        category: 'special',
        unlockAge: 30,
        effect: 'preview_choices'
    },
    {
        id: 'skill_meditation',
        name: '🧘 Thiền định sâu',
        description: 'Giảm ngay 30 điểm Căng thẳng, hồi phục tinh thần.',
        cost: 25,
        cooldown: 3,
        category: 'health',
        unlockAge: 22,
        effect: 'reset_stress'
    },
    {
        id: 'skill_networking',
        name: '🤝 Networking Pro',
        description: 'Tăng ngay 25 điểm Quan hệ xã hội.',
        cost: 35,
        cooldown: 4,
        category: 'social',
        unlockAge: 25,
        effect: 'boost_relationships'
    },
    {
        id: 'skill_risk_taking',
        name: '🎲 Liều ăn nhiều',
        description: 'Tăng ngay 30 điểm Tài chính, nhưng cũng +15 Căng thẳng.',
        cost: 30,
        cooldown: 3,
        category: 'finance',
        unlockAge: 25,
        effect: 'risk_money'
    },
    {
        id: 'skill_time_management',
        name: '⏰ Quản lý thời gian',
        description: 'Tăng ngay 20 Kỹ năng và -10 Căng thẳng nhờ làm việc hiệu quả.',
        cost: 35,
        cooldown: 4,
        category: 'work',
        unlockAge: 24,
        effect: 'boost_skill'
    },
    {
        id: 'skill_resilience',
        name: '💪 Tinh thần thép',
        description: 'Tăng ngay 20 Sức khỏe và 15 Hạnh phúc.',
        cost: 30,
        cooldown: 4,
        category: 'health',
        unlockAge: 28,
        effect: 'boost_health'
    }
];

export function getCareerLevel(careerId: string, skillLevel: number) {
    const career = CAREERS[careerId];
    if (!career) return null;
    let currentLevel = career.levels[0];
    for (const level of career.levels) {
        if (skillLevel >= level.minSkill) {
            currentLevel = level;
        }
    }
    return currentLevel;
}
