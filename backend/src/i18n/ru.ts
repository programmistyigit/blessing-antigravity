// Русский язык - Backend сообщения
import type { BackendTranslationKeys } from './uz';

export const ru: BackendTranslationKeys = {
    errors: {
        // Auth
        unauthorized: "Требуется авторизация",
        forbidden: "Доступ запрещён",
        invalidCredentials: "Неверный логин или пароль",
        tokenExpired: "Сессия истекла. Войдите снова",
        tokenInvalid: "Недействительный токен",

        // Validation
        validationError: "Ошибка валидации",
        required: "Обязательное поле",
        invalidFormat: "Неверный формат",

        // Resources
        notFound: "Не найдено",
        userNotFound: "Пользователь не найден",
        sectionNotFound: "Секция не найдена",
        roleNotFound: "Роль не найдена",
        reportNotFound: "Отчёт не найден",

        // Actions
        alreadyExists: "Уже существует",
        reportAlreadySubmitted: "Отчёт за сегодня уже был подан",
        cannotDelete: "Невозможно удалить",
        cannotUpdate: "Невозможно обновить",

        // Server
        serverError: "Ошибка сервера. Попробуйте позже",
        databaseError: "Ошибка базы данных",
    },
    success: {
        // Auth
        loginSuccess: "Успешный вход",
        logoutSuccess: "Успешный выход",

        // CRUD
        created: "Успешно создано",
        updated: "Успешно обновлено",
        deleted: "Успешно удалено",

        // Reports
        reportSubmitted: "Отчёт успешно подан",
        reportApproved: "Отчёт одобрен",
        reportRejected: "Отчёт отклонён",
    },
    warnings: {
        highMortality: "Обнаружен высокий показатель падежа",
        lowFeed: "Заканчивается запас корма",
        reminderDailyReport: "Не забудьте подать ежедневный отчёт",
    },
};
