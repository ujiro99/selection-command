import { HUB_URL } from "@/const"

const msg = `
Esta Política de Privacidade descreve como as informações dos usuários são tratadas no Selection Command Hub (doravante denominado "o Serviço"). Ao utilizar o Serviço, considera-se que você aceitou esta Política de Privacidade.

## **1. Informações Coletadas**

O Serviço coleta os seguintes tipos de informações:

### **1-1. Informações de Comandos Publicadas pelos Usuários**
O Serviço coleta informações de comandos publicadas pelos usuários (por exemplo, nomes de comandos, URLs, descrições).  
Para mais detalhes sobre as configurações, consulte os [Termos de Serviço](${HUB_URL}/pt-BR/terms).  
*Nota: Estas informações são utilizadas apenas quando os usuários publicam ou recuperam dados dentro do Serviço.*

### **1-2. Dados de Uso**
O Serviço utiliza o Google Analytics para coletar dados de uso anonimizados. Estes dados incluem:
- Histórico de interações (por exemplo, transições de página, localizações e contagens de cliques)
- Informações do dispositivo (por exemplo, tipo de navegador, sistema operacional)
- Carimbos de data/hora de acesso
- Endereços IP de origem (processados para anonimização)
- Outros dados estatísticos anonimizados fornecidos pelo Google Analytics

### **1-3. Coleta de Informações Pessoais**
Como o Serviço não fornece funcionalidades de registro ou login, não coleta informações pessoais identificáveis (por exemplo, nomes, endereços de e-mail, endereços físicos).

## **2. Finalidade do Uso das Informações**

As informações coletadas são utilizadas para os seguintes fins:
1. Analisar e melhorar o uso do Serviço
2. Fornecer as funcionalidades necessárias para operar o Serviço

## **3. Gerenciamento das Informações**

O Serviço gerencia adequadamente as informações coletadas para prevenir acessos não autorizados ou violações de dados. Os dados coletados através do Google Analytics são gerenciados de acordo com a [Política de Privacidade do Google](https://www.google.com/analytics/terms/us.html).

## **4. Fornecimento a Terceiros**

O Serviço não fornece as informações coletadas a terceiros, exceto quando exigido por lei. No entanto, os dados coletados através do Google Analytics são processados pelo Google.

## **5. Uso de Cookies**

O Serviço utiliza cookies através do Google Analytics. Os cookies são armazenados nos navegadores dos usuários e são utilizados para melhorar a funcionalidade e analisar o comportamento dos usuários dentro do Serviço. Os usuários podem desativar os cookies através das configurações do seu navegador; no entanto, algumas funcionalidades podem não funcionar corretamente como resultado.

## **6. Alterações na Política de Privacidade**

Esta Política de Privacidade pode ser atualizada conforme necessário. A política revisada entrará em vigor após ser publicada nesta página.

## **7. Informações de Contato**

Para questões sobre esta Política de Privacidade, entre em contato conosco através de:
- [Página de Suporte da Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

Em vigor a partir de 01/10/2025
`
export default msg
