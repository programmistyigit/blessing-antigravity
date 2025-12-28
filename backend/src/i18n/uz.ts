// O'zbek tili - Backend xabarlar
export const uz = {
    errors: {
        // Auth
        unauthorized: "Avtorizatsiya talab qilinadi",
        forbidden: "Ruxsat yo'q",
        invalidCredentials: "Login yoki parol noto'g'ri",
        tokenExpired: "Sessiya muddati tugagan. Qayta kiring",
        tokenInvalid: "Noto'g'ri token",

        // Validation
        validationError: "Tekshirish xatosi",
        required: "Majburiy maydon",
        invalidFormat: "Noto'g'ri format",

        // Resources
        notFound: "Topilmadi",
        userNotFound: "Foydalanuvchi topilmadi",
        sectionNotFound: "Sex topilmadi",
        roleNotFound: "Rol topilmadi",
        reportNotFound: "Hisobot topilmadi",

        // Actions
        alreadyExists: "Allaqachon mavjud",
        reportAlreadySubmitted: "Bugungi hisobot allaqachon topshirilgan",
        cannotDelete: "O'chirib bo'lmaydi",
        cannotUpdate: "Yangilab bo'lmaydi",

        // Server
        serverError: "Server xatosi. Iltimos, keyinroq urinib ko'ring",
        databaseError: "Ma'lumotlar bazasi xatosi",
    },
    success: {
        // Auth
        loginSuccess: "Muvaffaqiyatli kirdingiz",
        logoutSuccess: "Muvaffaqiyatli chiqdingiz",

        // CRUD
        created: "Muvaffaqiyatli yaratildi",
        updated: "Muvaffaqiyatli yangilandi",
        deleted: "Muvaffaqiyatli o'chirildi",

        // Reports
        reportSubmitted: "Hisobot muvaffaqiyatli topshirildi",
        reportApproved: "Hisobot tasdiqlandi",
        reportRejected: "Hisobot rad etildi",
    },
    warnings: {
        highMortality: "Yuqori o'lim ko'rsatkichi aniqlandi",
        lowFeed: "Yem zaxirasi kam qoldi",
        reminderDailyReport: "Kunlik hisobotni topshirishni unutmang",
    },
};

export type BackendTranslationKeys = typeof uz;
