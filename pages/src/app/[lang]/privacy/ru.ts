import { HUB_URL } from '@/const'

const msg = `
Эта Политика конфиденциальности описывает, как обрабатывается информация пользователей в Selection Command Hub (далее именуемый "Сервис"). Используя Сервис, вы считаетесь согласившимся с настоящей Политикой конфиденциальности.

## **1. Собираемая информация**

Сервис собирает следующие типы информации:

### **1-1. Информация о командах, размещаемая пользователями**
Сервис собирает информацию о командах, размещаемую пользователями (например, названия команд, URL-адреса, описания).  
Подробности о настройках см. в [Условиях использования](${HUB_URL}/ru/terms).  
*Примечание: Эта информация используется только когда пользователи размещают или получают данные в рамках Сервиса.*

### **1-2. Данные об использовании**
Сервис использует Google Analytics для сбора анонимизированных данных об использовании. Эти данные включают:
- Историю взаимодействий (например, переходы между страницами, местоположения и количество кликов)
- Информацию об устройстве (например, тип браузера, операционная система)
- Временные метки доступа
- Исходные IP-адреса (обработанные для анонимизации)
- Другие анонимизированные статистические данные, предоставляемые Google Analytics

### **1-3. Сбор персональной информации**
Поскольку Сервис не предоставляет функции регистрации или входа пользователей, он не собирает никакой персональной информации (например, имена, адреса электронной почты, физические адреса).

## **2. Цель использования информации**

Собранная информация используется для следующих целей:
1. Анализ и улучшение использования Сервиса
2. Предоставление необходимых функций для работы Сервиса

## **3. Управление информацией**

Сервис надлежащим образом управляет собранной информацией для предотвращения несанкционированного доступа или утечки данных. Данные, собранные через Google Analytics, управляются в соответствии с [Политикой конфиденциальности Google](https://www.google.com/analytics/terms/us.html).

## **4. Предоставление третьим лицам**

Сервис не предоставляет собранную информацию третьим лицам, за исключением случаев, когда это требуется по закону. Однако данные, собранные через Google Analytics, обрабатываются Google.

## **5. Использование файлов cookie**

Сервис использует файлы cookie через Google Analytics. Файлы cookie хранятся в браузерах пользователей и используются для улучшения функциональности и анализа поведения пользователей в рамках Сервиса. Пользователи могут отключить файлы cookie через настройки своего браузера; однако некоторые функции могут не работать должным образом в результате.

## **6. Изменения в Политике конфиденциальности**

Настоящая Политика конфиденциальности может обновляться по мере необходимости. Пересмотренная политика вступает в силу после публикации на этой странице.

## **7. Контактная информация**

По вопросам, касающимся настоящей Политики конфиденциальности, обращайтесь к нам через:
- [Страницу поддержки Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

Действует с 01.10.2025
`
export default msg
