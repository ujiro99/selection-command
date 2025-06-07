import { HUB_URL } from '@/const'

const msg = `
Esta Política de Privacidade descreve como as informações dos utilizadores são tratadas no Selection Command Hub (doravante designado como "o Serviço"). Ao utilizar o Serviço, considera-se que aceitou esta Política de Privacidade.

## **1. Informações Recolhidas**

O Serviço recolhe os seguintes tipos de informações:

### **1-1. Informações de Comandos Publicadas pelos Utilizadores**
O Serviço recolhe informações de comandos publicadas pelos utilizadores (por exemplo, nomes de comandos, URLs, descrições).  
Para mais detalhes sobre as definições, consulte os [Termos de Serviço](${HUB_URL}/pt-PT/terms).  
*Nota: Estas informações são utilizadas apenas quando os utilizadores publicam ou recuperam dados dentro do Serviço.*

### **1-2. Dados de Utilização**
O Serviço utiliza o Google Analytics para recolher dados de utilização anonimizados. Estes dados incluem:
- Histórico de interações (por exemplo, transições de página, localizações e contagens de cliques)
- Informações do dispositivo (por exemplo, tipo de navegador, sistema operativo)
- Carimbos de data/hora de acesso
- Endereços IP de origem (processados para anonimização)
- Outros dados estatísticos anonimizados fornecidos pelo Google Analytics

### **1-3. Recolha de Informações Pessoais**
Como o Serviço não fornece funcionalidades de registo ou início de sessão, não recolhe informações pessoais identificáveis (por exemplo, nomes, endereços de correio eletrónico, moradas físicas).

## **2. Finalidade da Utilização das Informações**

As informações recolhidas são utilizadas para os seguintes fins:
1. Analisar e melhorar a utilização do Serviço
2. Fornecer as funcionalidades necessárias para operar o Serviço

## **3. Gestão das Informações**

O Serviço gere adequadamente as informações recolhidas para prevenir acessos não autorizados ou violações de dados. Os dados recolhidos através do Google Analytics são geridos de acordo com a [Política de Privacidade do Google](https://www.google.com/analytics/terms/us.html).

## **4. Fornecimento a Terceiros**

O Serviço não fornece as informações recolhidas a terceiros, exceto quando exigido por lei. No entanto, os dados recolhidos através do Google Analytics são processados pelo Google.

## **5. Utilização de Cookies**

O Serviço utiliza cookies através do Google Analytics. Os cookies são armazenados nos navegadores dos utilizadores e são utilizados para melhorar a funcionalidade e analisar o comportamento dos utilizadores dentro do Serviço. Os utilizadores podem desativar os cookies através das definições do seu navegador; no entanto, algumas funcionalidades podem não funcionar corretamente como resultado.

## **6. Alterações à Política de Privacidade**

Esta Política de Privacidade pode ser atualizada conforme necessário. A política revista entrará em vigor após ser publicada nesta página.

## **7. Informações de Contacto**

Para questões sobre esta Política de Privacidade, contacte-nos através de:
- [Página de Suporte da Chrome Web Store](https://chromewebstore.google.com/detail/nlnhbibaommoelemmdfnkjkgoppkohje/support)

Em vigor a partir de 01/10/2025
`
export default msg
