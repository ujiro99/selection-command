import { HUB_URL } from '@/const'

const msg = `
These Terms of Service (hereinafter referred to as the "Terms") set forth the conditions for using the "Selection Command Hub" (hereinafter referred to as the "Service") provided by Operator (hereinafter referred to as "We" or "Us"). Please read these Terms carefully before using the Service. By using the Service, you are deemed to have agreed to these Terms.

## 1. Application
1. These Terms apply to all relationships between Us and users regarding the use of the Service.
2. Any rules or guidelines separately established by Us concerning the Service shall constitute a part of these Terms.

## 2. Description of the Service
1. The Service relates to the Chrome extension "Selection Command" and provides the following functionalities:
   - The ability for users to post commands (hereinafter referred to as "Posted Data").
   - The ability for users to view and retrieve commands posted by other users.
2. Posted Data includes the following information:
   - The title of a webpage.
   - The URL of a webpage.
   - The icon of a webpage.
   - The description and classification of a command.
   - Other information necessary for displaying a webpage.
3. The Service does not require user registration and can be used anonymously.

## 3. Prohibited Conduct
Users are prohibited from engaging in the following activities when using the Service:
- Acts that violate laws or public order and morals.
- Acts that infringe on the rights of others (e.g., copyrights, trademark rights, privacy rights).
- Providing false, inaccurate, or harmful information as Posted Data.
- Acts that cause damage to the Service or other users.
- Any other acts deemed inappropriate by Us.

## 4. Handling of Posted Data
1. Users are solely responsible for their Posted Data. Once Posted Data is submitted, it cannot be modified or deleted, so please exercise caution when posting content.
2. We reserve the right to delete or make Posted Data private if necessary but are not obligated to do so.
3. If a third party raises claims of rights infringement regarding Posted Data, We may modify or delete such data at our discretion.
4. Unauthorized reproduction, duplication, or use of Posted Data or any part of the Service for purposes other than using the Service is prohibited.

## 5. Intellectual Property Rights and Usage Permissions
1. All intellectual property rights related to the Service belong to Us or rightful owners.
2. Users retain ownership of their Posted Data but are deemed to grant permission for others to use it under the following circumstances:
   - Other users may view, retrieve, use, edit, and redistribute Posted Data within the scope of the Service.
   - We may use, publish, edit, and distribute Posted Data as necessary for operating the Service.

## 6. Disclaimer
1. We do not guarantee that the Service will meet specific purposes, provide utility, or ensure safety for users.
2. We are not liable for any damages or disputes arising from Posted Data or its content.
3. We are also not liable for damages resulting from interruptions or termination of the Service.

## 7. Privacy Policy
1. The handling of personal information and cookies related to the use of this service shall be governed by the Privacy Policy separately established by us.
2. For details, please refer to the following page:
   - [Privacy Policy](${HUB_URL}/en/privacy)

## 8. Suspension and Restrictions
1. If a user violates these Terms, We may restrict access to or suspend their use of the Service without prior notice.

## 9. Changes and Termination
1. We reserve the right to change or terminate these Terms and/or the content of the Service without prior notice.
2. Continued use of the Service after changes have been made constitutes acceptance of the new Terms.

## 10. Support Contact
For inquiries or support requests related to this Service, please contact us via:
- [Chrome Web Store Support Page](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

## 11. Governing Law and Jurisdiction
1. These Terms shall be governed by Japanese law.
2. In case of disputes arising from these Terms or the Service, exclusive jurisdiction shall lie with courts in Japan.

Effective as of 01/10/2025
`
export default msg
