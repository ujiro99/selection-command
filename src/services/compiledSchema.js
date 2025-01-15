"use strict";
exports["-1d18ab07"] = validate10;
const schema11 = {"title":"SettingSchema","type":"object","required":["startupMethod","commands","popupPlacement","style"],"properties":{"startupMethod":{"$id":"#/startupMethod","$ref":"#/definitions/startupMethod"},"popupPlacement":{"$id":"#/popupPlacement","$ref":"#/definitions/popupPlacement"},"style":{"$id":"#/style","type":"string","default":"vertical","enum":["vertical","horizontal"]},"commands":{"type":"array","minItems":1,"maxItems":100,"items":{"$ref":"#/definitions/command"}},"folders":{"type":"array","items":{"$ref":"#/definitions/commandFolder"}},"linkCommand":{"type":"object","required":["enabled","openMode","showIndicator"],"additionalProperties":false,"properties":{"enabled":{"name":"Enabled","$id":"#/linkCommand/enabled","type":"string","enum":["Enable","Disable"],"default":"Enable"},"openMode":{"name":"OpenMode","$id":"#/linkCommand/openMode","type":"string","enum":["previewPopup","previewWindow"],"default":"previewPopup"},"showIndicator":{"name":"ShowIndicator","$id":"#/linkCommand/showIndicator","type":"boolean","default":true},"startupMethod":{"$ref":"#/definitions/linkCommandStartupMethod"}}},"pageRules":{"type":"array","items":{"type":"object","required":["urlPattern","popupEnabled","popupPlacement","linkCommandEnabled"],"additionalProperties":false,"properties":{"urlPattern":{"type":"string"},"popupEnabled":{"$id":"#/pageRules/popupEnabled","type":"string","enum":["Enable","Disable"],"default":"Enable"},"popupPlacement":{"$id":"#/pageRules/popupPlacement","$ref":"#/definitions/popupPlacement"},"linkCommandEnabled":{"$id":"#/pageRules/linkCommandEnabled","type":"string","enum":["Inherit","Enable","Disable"],"default":"Inherit"}}}},"userStyles":{"type":"array","items":{"$ref":"#/definitions/styleVariable"}}},"definitions":{"popupPlacement":{"type":"string","default":"top-end","enum":["top","top-start","top-end","bottom","bottom-start","bottom-end"]},"startupMethod":{"type":"object","name":"StartupMethod","additionalProperties":false,"required":["method"],"properties":{"method":{"$id":"#/startupMethod/method","$ref":"#/definitions/startupMethodEnum","default":"textSelection"}},"dependencies":{"method":{"oneOf":[{"properties":{"method":{"enum":["textSelection"]}}},{"properties":{"method":{"enum":["contextMenu"]}}},{"properties":{"method":{"enum":["keyboard"]},"keyboardParam":{"$id":"#/startupMethod/param/keyboard","type":"string","enum":["Control","Alt","Shift"],"default":"Control"}},"required":["keyboardParam"]},{"properties":{"method":{"enum":["leftClickHold"]},"leftClickHoldParam":{"$id":"#/startupMethod/param/leftClickHold","type":"number","minimum":50,"maximum":500,"step":10,"default":200}},"required":["leftClickHoldParam"]}]}}},"command":{"type":"object","name":"Command","required":["title","iconUrl","openMode"],"additionalProperties":false,"properties":{"title":{"type":"string"},"openMode":{"$id":"#/commands/openMode","$ref":"#/definitions/openMode","default":"popup"},"iconUrl":{"$id":"#/commands/iconUrl","type":"string"},"parentFolderId":{"$id":"#/commands/parentFolderId","$ref":"#/definitions/folderOptions"}},"dependencies":{"openMode":{"oneOf":[{"properties":{"openMode":{"enum":["popup"]},"openModeSecondary":{"$id":"#/commands/openModeSecondary_popup","$ref":"#/definitions/openModeSecondary","default":"tab"},"searchUrl":{"type":"string"},"spaceEncoding":{"$id":"#/commands/spaceEncoding_popup","$ref":"#/definitions/spaceEncoding"},"popupOption":{"$ref":"#/definitions/popupOption"}},"required":["searchUrl","popupOption"]},{"properties":{"openMode":{"enum":["tab"]},"openModeSecondary":{"$id":"#/commands/openModeSecondary_tab","$ref":"#/definitions/openModeSecondary","default":"tab"},"searchUrl":{"type":"string"},"spaceEncoding":{"$id":"#/commands/spaceEncoding_tab","$ref":"#/definitions/spaceEncoding"}},"required":["searchUrl"]},{"properties":{"openMode":{"enum":["window"]},"openModeSecondary":{"$id":"#/commands/openModeSecondary_window","$ref":"#/definitions/openModeSecondary","default":"tab"},"searchUrl":{"type":"string"},"spaceEncoding":{"$id":"#/commands/spaceEncoding_window","$ref":"#/definitions/spaceEncoding"},"popupOption":{"$ref":"#/definitions/popupOption"}},"required":["searchUrl","popupOption"]},{"properties":{"openMode":{"enum":["api"]},"searchUrl":{"type":"string"},"fetchOptions":{"$id":"#/commands/fetchOptions","type":"string"},"variables":{"type":"array","items":{"$ref":"#/definitions/commandVariable"}}},"required":["searchUrl","fetchOptions","variables"]},{"properties":{"openMode":{"enum":["linkPopup"]},"title":{"type":"string","default":"Link Popup"},"iconUrl":{"type":"string","default":"https://cdn3.iconfinder.com/data/icons/fluent-regular-24px-vol-5/24/ic_fluent_open_24_regular-1024.png"}}},{"properties":{"openMode":{"enum":["copy"]},"copyOption":{"$id":"#/commands/copyOption","type":"string","enum":["default","text"],"default":"default"},"title":{"type":"string","default":"Copy text"},"iconUrl":{"type":"string","default":"https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-2/256/copy-light-1024.png"}},"required":["copyOption"]},{"properties":{"openMode":{"enum":["getTextStyles"]},"title":{"type":"string","default":"Get Text Styles"},"iconUrl":{"type":"string","default":"https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-3/256/paint-brush-light-1024.png"}}}]}}},"commandFolder":{"type":"object","name":"Folder","required":["title"],"additionalProperties":false,"properties":{"id":{"type":"string"},"title":{"type":"string"},"iconUrl":{"$id":"#/commandFolder/iconUrl","type":"string","default":"https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-512.png"},"onlyIcon":{"name":"OnlyIcon","$id":"#/commandFolder/onlyIcon","type":"boolean"}}},"popupOption":{"type":"object","required":["width","height"],"additionalProperties":false,"properties":{"width":{"type":"number","default":600},"height":{"type":"number","default":700}}},"folderOptions":{"enumNames":[""],"enum":[{"id":"","name":""}]},"openMode":{"type":"string","enum":["popup","window","tab","api","linkPopup","copy","getTextStyles"]},"openModeSecondary":{"type":"string","enum":["popup","window","tab"]},"startupMethodEnum":{"type":"string","enum":["textSelection","contextMenu","keyboard","leftClickHold"]},"spaceEncoding":{"type":"string","default":"plus","enum":["plus","percent"]},"commandVariable":{"type":"object","name":"Variable","required":["name","value"],"additionalProperties":false,"properties":{"name":{"type":"string"},"value":{"type":"string"}}},"linkCommandStartupMethod":{"type":"object","name":"LinkCommandStartupMethod","additionalProperties":false,"required":["method"],"properties":{"method":{"$id":"#/linkCommandStartupMethod/method","type":"string","enum":["keyboard","drag","leftClickHold"],"default":"keyboard"}},"dependencies":{"method":{"oneOf":[{"properties":{"method":{"enum":["keyboard"]},"keyboardParam":{"$id":"#/linkCommandStartupMethod/param/keyboard","type":"string","enum":["Shift","Alt","Control"],"default":"Shift"}},"required":["keyboardParam"]},{"properties":{"method":{"enum":["drag"]},"threshold":{"name":"Threshold","$id":"#/linkCommandStartupMethod/param/threshold","type":"number","default":150,"minimum":50,"maximum":400,"step":10}},"required":["threshold"]},{"properties":{"method":{"enum":["leftClickHold"]},"leftClickHoldParam":{"$id":"#/linkCommandStartupMethod/param/leftClickHold","type":"number","default":200,"minimum":50,"maximum":500,"step":10}},"required":["leftClickHoldParam"]}]}}},"styleVariable":{"$id":"#/styleVariable","type":"object","name":"styleVariable","required":["name","value"],"properties":{"name":{"type":"string","enum":["background-color","border-color","font-scale","image-scale","padding-scale","popup-delay","popup-duration"]},"value":{"type":"string"}}}},"$id":"-1d18ab07"};
const schema14 = {"type":"string","default":"top-end","enum":["top","top-start","top-end","bottom","bottom-start","bottom-end"]};
const schema27 = {"type":"object","name":"Folder","required":["title"],"additionalProperties":false,"properties":{"id":{"type":"string"},"title":{"type":"string"},"iconUrl":{"$id":"#/commandFolder/iconUrl","type":"string","default":"https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-512.png"},"onlyIcon":{"name":"OnlyIcon","$id":"#/commandFolder/onlyIcon","type":"boolean"}}};
const schema28 = {"type":"object","name":"LinkCommandStartupMethod","additionalProperties":false,"required":["method"],"properties":{"method":{"$id":"#/linkCommandStartupMethod/method","type":"string","enum":["keyboard","drag","leftClickHold"],"default":"keyboard"}},"dependencies":{"method":{"oneOf":[{"properties":{"method":{"enum":["keyboard"]},"keyboardParam":{"$id":"#/linkCommandStartupMethod/param/keyboard","type":"string","enum":["Shift","Alt","Control"],"default":"Shift"}},"required":["keyboardParam"]},{"properties":{"method":{"enum":["drag"]},"threshold":{"name":"Threshold","$id":"#/linkCommandStartupMethod/param/threshold","type":"number","default":150,"minimum":50,"maximum":400,"step":10}},"required":["threshold"]},{"properties":{"method":{"enum":["leftClickHold"]},"leftClickHoldParam":{"$id":"#/linkCommandStartupMethod/param/leftClickHold","type":"number","default":200,"minimum":50,"maximum":500,"step":10}},"required":["leftClickHoldParam"]}]}}};
const schema30 = {"$id":"#/styleVariable","type":"object","name":"styleVariable","required":["name","value"],"properties":{"name":{"type":"string","enum":["background-color","border-color","font-scale","image-scale","padding-scale","popup-delay","popup-duration"]},"value":{"type":"string"}}};
const schema12 = {"type":"object","name":"StartupMethod","additionalProperties":false,"required":["method"],"properties":{"method":{"$id":"#/startupMethod/method","$ref":"#/definitions/startupMethodEnum","default":"textSelection"}},"dependencies":{"method":{"oneOf":[{"properties":{"method":{"enum":["textSelection"]}}},{"properties":{"method":{"enum":["contextMenu"]}}},{"properties":{"method":{"enum":["keyboard"]},"keyboardParam":{"$id":"#/startupMethod/param/keyboard","type":"string","enum":["Control","Alt","Shift"],"default":"Control"}},"required":["keyboardParam"]},{"properties":{"method":{"enum":["leftClickHold"]},"leftClickHoldParam":{"$id":"#/startupMethod/param/leftClickHold","type":"number","minimum":50,"maximum":500,"step":10,"default":200}},"required":["leftClickHoldParam"]}]}}};
const schema13 = {"type":"string","enum":["textSelection","contextMenu","keyboard","leftClickHold"]};

function validate11(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.method === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "method"},message:"must have required property '"+"method"+"'",schema:schema12.required,parentSchema:schema12,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
for(const key0 in data){
if(!(key0 === "method")){
const err1 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema12,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
}
if(data.method !== undefined){
const _errs3 = errors;
let valid1 = false;
let passing0 = null;
const _errs4 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.method !== undefined){
let data0 = data.method;
if(!(data0 === "textSelection")){
const err2 = {instancePath:instancePath+"/method",schemaPath:"#/dependencies/method/oneOf/0/properties/method/enum",keyword:"enum",params:{allowedValues: schema12.dependencies.method.oneOf[0].properties.method.enum},message:"must be equal to one of the allowed values",schema:schema12.dependencies.method.oneOf[0].properties.method.enum,parentSchema:schema12.dependencies.method.oneOf[0].properties.method,data:data0};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
}
}
var _valid0 = _errs4 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs6 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.method !== undefined){
let data1 = data.method;
if(!(data1 === "contextMenu")){
const err3 = {instancePath:instancePath+"/method",schemaPath:"#/dependencies/method/oneOf/1/properties/method/enum",keyword:"enum",params:{allowedValues: schema12.dependencies.method.oneOf[1].properties.method.enum},message:"must be equal to one of the allowed values",schema:schema12.dependencies.method.oneOf[1].properties.method.enum,parentSchema:schema12.dependencies.method.oneOf[1].properties.method,data:data1};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
}
var _valid0 = _errs6 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
}
const _errs8 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.keyboardParam === undefined){
const err4 = {instancePath,schemaPath:"#/dependencies/method/oneOf/2/required",keyword:"required",params:{missingProperty: "keyboardParam"},message:"must have required property '"+"keyboardParam"+"'",schema:schema12.dependencies.method.oneOf[2].required,parentSchema:schema12.dependencies.method.oneOf[2],data};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.method !== undefined){
let data2 = data.method;
if(!(data2 === "keyboard")){
const err5 = {instancePath:instancePath+"/method",schemaPath:"#/dependencies/method/oneOf/2/properties/method/enum",keyword:"enum",params:{allowedValues: schema12.dependencies.method.oneOf[2].properties.method.enum},message:"must be equal to one of the allowed values",schema:schema12.dependencies.method.oneOf[2].properties.method.enum,parentSchema:schema12.dependencies.method.oneOf[2].properties.method,data:data2};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.keyboardParam !== undefined){
let data3 = data.keyboardParam;
if(typeof data3 !== "string"){
const err6 = {instancePath:instancePath+"/keyboardParam",schemaPath:"#/dependencies/method/oneOf/2/properties/keyboardParam/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema12.dependencies.method.oneOf[2].properties.keyboardParam.type,parentSchema:schema12.dependencies.method.oneOf[2].properties.keyboardParam,data:data3};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!(((data3 === "Control") || (data3 === "Alt")) || (data3 === "Shift"))){
const err7 = {instancePath:instancePath+"/keyboardParam",schemaPath:"#/dependencies/method/oneOf/2/properties/keyboardParam/enum",keyword:"enum",params:{allowedValues: schema12.dependencies.method.oneOf[2].properties.keyboardParam.enum},message:"must be equal to one of the allowed values",schema:schema12.dependencies.method.oneOf[2].properties.keyboardParam.enum,parentSchema:schema12.dependencies.method.oneOf[2].properties.keyboardParam,data:data3};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
}
var _valid0 = _errs8 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid1 = true;
passing0 = 2;
}
const _errs12 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.leftClickHoldParam === undefined){
const err8 = {instancePath,schemaPath:"#/dependencies/method/oneOf/3/required",keyword:"required",params:{missingProperty: "leftClickHoldParam"},message:"must have required property '"+"leftClickHoldParam"+"'",schema:schema12.dependencies.method.oneOf[3].required,parentSchema:schema12.dependencies.method.oneOf[3],data};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data.method !== undefined){
let data4 = data.method;
if(!(data4 === "leftClickHold")){
const err9 = {instancePath:instancePath+"/method",schemaPath:"#/dependencies/method/oneOf/3/properties/method/enum",keyword:"enum",params:{allowedValues: schema12.dependencies.method.oneOf[3].properties.method.enum},message:"must be equal to one of the allowed values",schema:schema12.dependencies.method.oneOf[3].properties.method.enum,parentSchema:schema12.dependencies.method.oneOf[3].properties.method,data:data4};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.leftClickHoldParam !== undefined){
let data5 = data.leftClickHoldParam;
if(typeof data5 == "number"){
if(data5 > 500 || isNaN(data5)){
const err10 = {instancePath:instancePath+"/leftClickHoldParam",schemaPath:"#/dependencies/method/oneOf/3/properties/leftClickHoldParam/maximum",keyword:"maximum",params:{comparison: "<=", limit: 500},message:"must be <= 500",schema:500,parentSchema:schema12.dependencies.method.oneOf[3].properties.leftClickHoldParam,data:data5};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(data5 < 50 || isNaN(data5)){
const err11 = {instancePath:instancePath+"/leftClickHoldParam",schemaPath:"#/dependencies/method/oneOf/3/properties/leftClickHoldParam/minimum",keyword:"minimum",params:{comparison: ">=", limit: 50},message:"must be >= 50",schema:50,parentSchema:schema12.dependencies.method.oneOf[3].properties.leftClickHoldParam,data:data5};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
else {
const err12 = {instancePath:instancePath+"/leftClickHoldParam",schemaPath:"#/dependencies/method/oneOf/3/properties/leftClickHoldParam/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema12.dependencies.method.oneOf[3].properties.leftClickHoldParam.type,parentSchema:schema12.dependencies.method.oneOf[3].properties.leftClickHoldParam,data:data5};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
}
var _valid0 = _errs12 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid1 = true;
passing0 = 3;
}
}
}
}
if(!valid1){
const err13 = {instancePath,schemaPath:"#/dependencies/method/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema12.dependencies.method.oneOf,parentSchema:schema12.dependencies.method,data};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
else {
errors = _errs3;
if(vErrors !== null){
if(_errs3){
vErrors.length = _errs3;
}
else {
vErrors = null;
}
}
}
}
if(data.method !== undefined){
let data6 = data.method;
if(typeof data6 !== "string"){
const err14 = {instancePath:instancePath+"/method",schemaPath:"#/definitions/startupMethodEnum/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema13.type,parentSchema:schema13,data:data6};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
if(!((((data6 === "textSelection") || (data6 === "contextMenu")) || (data6 === "keyboard")) || (data6 === "leftClickHold"))){
const err15 = {instancePath:instancePath+"/method",schemaPath:"#/definitions/startupMethodEnum/enum",keyword:"enum",params:{allowedValues: schema13.enum},message:"must be equal to one of the allowed values",schema:schema13.enum,parentSchema:schema13,data:data6};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
}
else {
const err16 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema12.type,parentSchema:schema12,data};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
validate11.errors = vErrors;
return errors === 0;
}

const schema15 = {"type":"object","name":"Command","required":["title","iconUrl","openMode"],"additionalProperties":false,"properties":{"title":{"type":"string"},"openMode":{"$id":"#/commands/openMode","$ref":"#/definitions/openMode","default":"popup"},"iconUrl":{"$id":"#/commands/iconUrl","type":"string"},"parentFolderId":{"$id":"#/commands/parentFolderId","$ref":"#/definitions/folderOptions"}},"dependencies":{"openMode":{"oneOf":[{"properties":{"openMode":{"enum":["popup"]},"openModeSecondary":{"$id":"#/commands/openModeSecondary_popup","$ref":"#/definitions/openModeSecondary","default":"tab"},"searchUrl":{"type":"string"},"spaceEncoding":{"$id":"#/commands/spaceEncoding_popup","$ref":"#/definitions/spaceEncoding"},"popupOption":{"$ref":"#/definitions/popupOption"}},"required":["searchUrl","popupOption"]},{"properties":{"openMode":{"enum":["tab"]},"openModeSecondary":{"$id":"#/commands/openModeSecondary_tab","$ref":"#/definitions/openModeSecondary","default":"tab"},"searchUrl":{"type":"string"},"spaceEncoding":{"$id":"#/commands/spaceEncoding_tab","$ref":"#/definitions/spaceEncoding"}},"required":["searchUrl"]},{"properties":{"openMode":{"enum":["window"]},"openModeSecondary":{"$id":"#/commands/openModeSecondary_window","$ref":"#/definitions/openModeSecondary","default":"tab"},"searchUrl":{"type":"string"},"spaceEncoding":{"$id":"#/commands/spaceEncoding_window","$ref":"#/definitions/spaceEncoding"},"popupOption":{"$ref":"#/definitions/popupOption"}},"required":["searchUrl","popupOption"]},{"properties":{"openMode":{"enum":["api"]},"searchUrl":{"type":"string"},"fetchOptions":{"$id":"#/commands/fetchOptions","type":"string"},"variables":{"type":"array","items":{"$ref":"#/definitions/commandVariable"}}},"required":["searchUrl","fetchOptions","variables"]},{"properties":{"openMode":{"enum":["linkPopup"]},"title":{"type":"string","default":"Link Popup"},"iconUrl":{"type":"string","default":"https://cdn3.iconfinder.com/data/icons/fluent-regular-24px-vol-5/24/ic_fluent_open_24_regular-1024.png"}}},{"properties":{"openMode":{"enum":["copy"]},"copyOption":{"$id":"#/commands/copyOption","type":"string","enum":["default","text"],"default":"default"},"title":{"type":"string","default":"Copy text"},"iconUrl":{"type":"string","default":"https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-2/256/copy-light-1024.png"}},"required":["copyOption"]},{"properties":{"openMode":{"enum":["getTextStyles"]},"title":{"type":"string","default":"Get Text Styles"},"iconUrl":{"type":"string","default":"https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-3/256/paint-brush-light-1024.png"}}}]}}};
const schema16 = {"type":"string","enum":["popup","window","tab"]};
const schema17 = {"type":"string","default":"plus","enum":["plus","percent"]};
const schema18 = {"type":"object","required":["width","height"],"additionalProperties":false,"properties":{"width":{"type":"number","default":600},"height":{"type":"number","default":700}}};
const schema24 = {"type":"object","name":"Variable","required":["name","value"],"additionalProperties":false,"properties":{"name":{"type":"string"},"value":{"type":"string"}}};
const schema25 = {"type":"string","enum":["popup","window","tab","api","linkPopup","copy","getTextStyles"]};
const schema26 = {"enumNames":[""],"enum":[{"id":"","name":""}]};
const func0 = require("ajv/dist/runtime/equal").default;

function validate13(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.title === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'",schema:schema15.required,parentSchema:schema15,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.iconUrl === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "iconUrl"},message:"must have required property '"+"iconUrl"+"'",schema:schema15.required,parentSchema:schema15,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.openMode === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "openMode"},message:"must have required property '"+"openMode"+"'",schema:schema15.required,parentSchema:schema15,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
for(const key0 in data){
if(!((((key0 === "title") || (key0 === "openMode")) || (key0 === "iconUrl")) || (key0 === "parentFolderId"))){
const err3 = {instancePath,schemaPath:"#/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema15,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
}
if(data.openMode !== undefined){
const _errs3 = errors;
let valid1 = false;
let passing0 = null;
const _errs4 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.searchUrl === undefined){
const err4 = {instancePath,schemaPath:"#/dependencies/openMode/oneOf/0/required",keyword:"required",params:{missingProperty: "searchUrl"},message:"must have required property '"+"searchUrl"+"'",schema:schema15.dependencies.openMode.oneOf[0].required,parentSchema:schema15.dependencies.openMode.oneOf[0],data};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(data.popupOption === undefined){
const err5 = {instancePath,schemaPath:"#/dependencies/openMode/oneOf/0/required",keyword:"required",params:{missingProperty: "popupOption"},message:"must have required property '"+"popupOption"+"'",schema:schema15.dependencies.openMode.oneOf[0].required,parentSchema:schema15.dependencies.openMode.oneOf[0],data};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
if(data.openMode !== undefined){
let data0 = data.openMode;
if(!(data0 === "popup")){
const err6 = {instancePath:instancePath+"/openMode",schemaPath:"#/dependencies/openMode/oneOf/0/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema15.dependencies.openMode.oneOf[0].properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema15.dependencies.openMode.oneOf[0].properties.openMode.enum,parentSchema:schema15.dependencies.openMode.oneOf[0].properties.openMode,data:data0};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
}
if(data.openModeSecondary !== undefined){
let data1 = data.openModeSecondary;
if(typeof data1 !== "string"){
const err7 = {instancePath:instancePath+"/openModeSecondary",schemaPath:"#/definitions/openModeSecondary/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema16.type,parentSchema:schema16,data:data1};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
if(!(((data1 === "popup") || (data1 === "window")) || (data1 === "tab"))){
const err8 = {instancePath:instancePath+"/openModeSecondary",schemaPath:"#/definitions/openModeSecondary/enum",keyword:"enum",params:{allowedValues: schema16.enum},message:"must be equal to one of the allowed values",schema:schema16.enum,parentSchema:schema16,data:data1};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
}
if(data.searchUrl !== undefined){
let data2 = data.searchUrl;
if(typeof data2 !== "string"){
const err9 = {instancePath:instancePath+"/searchUrl",schemaPath:"#/dependencies/openMode/oneOf/0/properties/searchUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[0].properties.searchUrl.type,parentSchema:schema15.dependencies.openMode.oneOf[0].properties.searchUrl,data:data2};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
}
if(data.spaceEncoding !== undefined){
let data3 = data.spaceEncoding;
if(typeof data3 !== "string"){
const err10 = {instancePath:instancePath+"/spaceEncoding",schemaPath:"#/definitions/spaceEncoding/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema17.type,parentSchema:schema17,data:data3};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
if(!((data3 === "plus") || (data3 === "percent"))){
const err11 = {instancePath:instancePath+"/spaceEncoding",schemaPath:"#/definitions/spaceEncoding/enum",keyword:"enum",params:{allowedValues: schema17.enum},message:"must be equal to one of the allowed values",schema:schema17.enum,parentSchema:schema17,data:data3};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
}
if(data.popupOption !== undefined){
let data4 = data.popupOption;
if(data4 && typeof data4 == "object" && !Array.isArray(data4)){
if(data4.width === undefined){
const err12 = {instancePath:instancePath+"/popupOption",schemaPath:"#/definitions/popupOption/required",keyword:"required",params:{missingProperty: "width"},message:"must have required property '"+"width"+"'",schema:schema18.required,parentSchema:schema18,data:data4};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
if(data4.height === undefined){
const err13 = {instancePath:instancePath+"/popupOption",schemaPath:"#/definitions/popupOption/required",keyword:"required",params:{missingProperty: "height"},message:"must have required property '"+"height"+"'",schema:schema18.required,parentSchema:schema18,data:data4};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
for(const key1 in data4){
if(!((key1 === "width") || (key1 === "height"))){
const err14 = {instancePath:instancePath+"/popupOption",schemaPath:"#/definitions/popupOption/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema18,data:data4};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data4.width !== undefined){
let data5 = data4.width;
if(!(typeof data5 == "number")){
const err15 = {instancePath:instancePath+"/popupOption/width",schemaPath:"#/definitions/popupOption/properties/width/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema18.properties.width.type,parentSchema:schema18.properties.width,data:data5};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data4.height !== undefined){
let data6 = data4.height;
if(!(typeof data6 == "number")){
const err16 = {instancePath:instancePath+"/popupOption/height",schemaPath:"#/definitions/popupOption/properties/height/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema18.properties.height.type,parentSchema:schema18.properties.height,data:data6};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
else {
const err17 = {instancePath:instancePath+"/popupOption",schemaPath:"#/definitions/popupOption/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema18.type,parentSchema:schema18,data:data4};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
var _valid0 = _errs4 === errors;
if(_valid0){
valid1 = true;
passing0 = 0;
}
const _errs22 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.searchUrl === undefined){
const err18 = {instancePath,schemaPath:"#/dependencies/openMode/oneOf/1/required",keyword:"required",params:{missingProperty: "searchUrl"},message:"must have required property '"+"searchUrl"+"'",schema:schema15.dependencies.openMode.oneOf[1].required,parentSchema:schema15.dependencies.openMode.oneOf[1],data};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
if(data.openMode !== undefined){
let data7 = data.openMode;
if(!(data7 === "tab")){
const err19 = {instancePath:instancePath+"/openMode",schemaPath:"#/dependencies/openMode/oneOf/1/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema15.dependencies.openMode.oneOf[1].properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema15.dependencies.openMode.oneOf[1].properties.openMode.enum,parentSchema:schema15.dependencies.openMode.oneOf[1].properties.openMode,data:data7};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
}
if(data.openModeSecondary !== undefined){
let data8 = data.openModeSecondary;
if(typeof data8 !== "string"){
const err20 = {instancePath:instancePath+"/openModeSecondary",schemaPath:"#/definitions/openModeSecondary/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema16.type,parentSchema:schema16,data:data8};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(!(((data8 === "popup") || (data8 === "window")) || (data8 === "tab"))){
const err21 = {instancePath:instancePath+"/openModeSecondary",schemaPath:"#/definitions/openModeSecondary/enum",keyword:"enum",params:{allowedValues: schema16.enum},message:"must be equal to one of the allowed values",schema:schema16.enum,parentSchema:schema16,data:data8};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
}
if(data.searchUrl !== undefined){
let data9 = data.searchUrl;
if(typeof data9 !== "string"){
const err22 = {instancePath:instancePath+"/searchUrl",schemaPath:"#/dependencies/openMode/oneOf/1/properties/searchUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[1].properties.searchUrl.type,parentSchema:schema15.dependencies.openMode.oneOf[1].properties.searchUrl,data:data9};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data.spaceEncoding !== undefined){
let data10 = data.spaceEncoding;
if(typeof data10 !== "string"){
const err23 = {instancePath:instancePath+"/spaceEncoding",schemaPath:"#/definitions/spaceEncoding/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema17.type,parentSchema:schema17,data:data10};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(!((data10 === "plus") || (data10 === "percent"))){
const err24 = {instancePath:instancePath+"/spaceEncoding",schemaPath:"#/definitions/spaceEncoding/enum",keyword:"enum",params:{allowedValues: schema17.enum},message:"must be equal to one of the allowed values",schema:schema17.enum,parentSchema:schema17,data:data10};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
}
var _valid0 = _errs22 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid1 = true;
passing0 = 1;
}
const _errs32 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.searchUrl === undefined){
const err25 = {instancePath,schemaPath:"#/dependencies/openMode/oneOf/2/required",keyword:"required",params:{missingProperty: "searchUrl"},message:"must have required property '"+"searchUrl"+"'",schema:schema15.dependencies.openMode.oneOf[2].required,parentSchema:schema15.dependencies.openMode.oneOf[2],data};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(data.popupOption === undefined){
const err26 = {instancePath,schemaPath:"#/dependencies/openMode/oneOf/2/required",keyword:"required",params:{missingProperty: "popupOption"},message:"must have required property '"+"popupOption"+"'",schema:schema15.dependencies.openMode.oneOf[2].required,parentSchema:schema15.dependencies.openMode.oneOf[2],data};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
if(data.openMode !== undefined){
let data11 = data.openMode;
if(!(data11 === "window")){
const err27 = {instancePath:instancePath+"/openMode",schemaPath:"#/dependencies/openMode/oneOf/2/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema15.dependencies.openMode.oneOf[2].properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema15.dependencies.openMode.oneOf[2].properties.openMode.enum,parentSchema:schema15.dependencies.openMode.oneOf[2].properties.openMode,data:data11};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data.openModeSecondary !== undefined){
let data12 = data.openModeSecondary;
if(typeof data12 !== "string"){
const err28 = {instancePath:instancePath+"/openModeSecondary",schemaPath:"#/definitions/openModeSecondary/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema16.type,parentSchema:schema16,data:data12};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
if(!(((data12 === "popup") || (data12 === "window")) || (data12 === "tab"))){
const err29 = {instancePath:instancePath+"/openModeSecondary",schemaPath:"#/definitions/openModeSecondary/enum",keyword:"enum",params:{allowedValues: schema16.enum},message:"must be equal to one of the allowed values",schema:schema16.enum,parentSchema:schema16,data:data12};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data.searchUrl !== undefined){
let data13 = data.searchUrl;
if(typeof data13 !== "string"){
const err30 = {instancePath:instancePath+"/searchUrl",schemaPath:"#/dependencies/openMode/oneOf/2/properties/searchUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[2].properties.searchUrl.type,parentSchema:schema15.dependencies.openMode.oneOf[2].properties.searchUrl,data:data13};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
}
if(data.spaceEncoding !== undefined){
let data14 = data.spaceEncoding;
if(typeof data14 !== "string"){
const err31 = {instancePath:instancePath+"/spaceEncoding",schemaPath:"#/definitions/spaceEncoding/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema17.type,parentSchema:schema17,data:data14};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
if(!((data14 === "plus") || (data14 === "percent"))){
const err32 = {instancePath:instancePath+"/spaceEncoding",schemaPath:"#/definitions/spaceEncoding/enum",keyword:"enum",params:{allowedValues: schema17.enum},message:"must be equal to one of the allowed values",schema:schema17.enum,parentSchema:schema17,data:data14};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
}
if(data.popupOption !== undefined){
let data15 = data.popupOption;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.width === undefined){
const err33 = {instancePath:instancePath+"/popupOption",schemaPath:"#/definitions/popupOption/required",keyword:"required",params:{missingProperty: "width"},message:"must have required property '"+"width"+"'",schema:schema18.required,parentSchema:schema18,data:data15};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
if(data15.height === undefined){
const err34 = {instancePath:instancePath+"/popupOption",schemaPath:"#/definitions/popupOption/required",keyword:"required",params:{missingProperty: "height"},message:"must have required property '"+"height"+"'",schema:schema18.required,parentSchema:schema18,data:data15};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
for(const key2 in data15){
if(!((key2 === "width") || (key2 === "height"))){
const err35 = {instancePath:instancePath+"/popupOption",schemaPath:"#/definitions/popupOption/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties",schema:false,parentSchema:schema18,data:data15};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data15.width !== undefined){
let data16 = data15.width;
if(!(typeof data16 == "number")){
const err36 = {instancePath:instancePath+"/popupOption/width",schemaPath:"#/definitions/popupOption/properties/width/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema18.properties.width.type,parentSchema:schema18.properties.width,data:data16};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
}
if(data15.height !== undefined){
let data17 = data15.height;
if(!(typeof data17 == "number")){
const err37 = {instancePath:instancePath+"/popupOption/height",schemaPath:"#/definitions/popupOption/properties/height/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema18.properties.height.type,parentSchema:schema18.properties.height,data:data17};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
}
else {
const err38 = {instancePath:instancePath+"/popupOption",schemaPath:"#/definitions/popupOption/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema18.type,parentSchema:schema18,data:data15};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
}
var _valid0 = _errs32 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid1 = true;
passing0 = 2;
}
const _errs50 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.searchUrl === undefined){
const err39 = {instancePath,schemaPath:"#/dependencies/openMode/oneOf/3/required",keyword:"required",params:{missingProperty: "searchUrl"},message:"must have required property '"+"searchUrl"+"'",schema:schema15.dependencies.openMode.oneOf[3].required,parentSchema:schema15.dependencies.openMode.oneOf[3],data};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data.fetchOptions === undefined){
const err40 = {instancePath,schemaPath:"#/dependencies/openMode/oneOf/3/required",keyword:"required",params:{missingProperty: "fetchOptions"},message:"must have required property '"+"fetchOptions"+"'",schema:schema15.dependencies.openMode.oneOf[3].required,parentSchema:schema15.dependencies.openMode.oneOf[3],data};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
if(data.variables === undefined){
const err41 = {instancePath,schemaPath:"#/dependencies/openMode/oneOf/3/required",keyword:"required",params:{missingProperty: "variables"},message:"must have required property '"+"variables"+"'",schema:schema15.dependencies.openMode.oneOf[3].required,parentSchema:schema15.dependencies.openMode.oneOf[3],data};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data.openMode !== undefined){
let data18 = data.openMode;
if(!(data18 === "api")){
const err42 = {instancePath:instancePath+"/openMode",schemaPath:"#/dependencies/openMode/oneOf/3/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema15.dependencies.openMode.oneOf[3].properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema15.dependencies.openMode.oneOf[3].properties.openMode.enum,parentSchema:schema15.dependencies.openMode.oneOf[3].properties.openMode,data:data18};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
if(data.searchUrl !== undefined){
let data19 = data.searchUrl;
if(typeof data19 !== "string"){
const err43 = {instancePath:instancePath+"/searchUrl",schemaPath:"#/dependencies/openMode/oneOf/3/properties/searchUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[3].properties.searchUrl.type,parentSchema:schema15.dependencies.openMode.oneOf[3].properties.searchUrl,data:data19};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
if(data.fetchOptions !== undefined){
let data20 = data.fetchOptions;
if(typeof data20 !== "string"){
const err44 = {instancePath:instancePath+"/fetchOptions",schemaPath:"#/dependencies/openMode/oneOf/3/properties/fetchOptions/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[3].properties.fetchOptions.type,parentSchema:schema15.dependencies.openMode.oneOf[3].properties.fetchOptions,data:data20};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
}
if(data.variables !== undefined){
let data21 = data.variables;
if(Array.isArray(data21)){
const len0 = data21.length;
for(let i0=0; i0<len0; i0++){
let data22 = data21[i0];
if(data22 && typeof data22 == "object" && !Array.isArray(data22)){
if(data22.name === undefined){
const err45 = {instancePath:instancePath+"/variables/" + i0,schemaPath:"#/definitions/commandVariable/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema24.required,parentSchema:schema24,data:data22};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(data22.value === undefined){
const err46 = {instancePath:instancePath+"/variables/" + i0,schemaPath:"#/definitions/commandVariable/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'",schema:schema24.required,parentSchema:schema24,data:data22};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
for(const key3 in data22){
if(!((key3 === "name") || (key3 === "value"))){
const err47 = {instancePath:instancePath+"/variables/" + i0,schemaPath:"#/definitions/commandVariable/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties",schema:false,parentSchema:schema24,data:data22};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
if(data22.name !== undefined){
let data23 = data22.name;
if(typeof data23 !== "string"){
const err48 = {instancePath:instancePath+"/variables/" + i0+"/name",schemaPath:"#/definitions/commandVariable/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema24.properties.name.type,parentSchema:schema24.properties.name,data:data23};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data22.value !== undefined){
let data24 = data22.value;
if(typeof data24 !== "string"){
const err49 = {instancePath:instancePath+"/variables/" + i0+"/value",schemaPath:"#/definitions/commandVariable/properties/value/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema24.properties.value.type,parentSchema:schema24.properties.value,data:data24};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
}
}
else {
const err50 = {instancePath:instancePath+"/variables/" + i0,schemaPath:"#/definitions/commandVariable/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema24.type,parentSchema:schema24,data:data22};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
}
}
else {
const err51 = {instancePath:instancePath+"/variables",schemaPath:"#/dependencies/openMode/oneOf/3/properties/variables/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema15.dependencies.openMode.oneOf[3].properties.variables.type,parentSchema:schema15.dependencies.openMode.oneOf[3].properties.variables,data:data21};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
}
}
var _valid0 = _errs50 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 3];
}
else {
if(_valid0){
valid1 = true;
passing0 = 3;
}
const _errs66 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.openMode !== undefined){
let data25 = data.openMode;
if(!(data25 === "linkPopup")){
const err52 = {instancePath:instancePath+"/openMode",schemaPath:"#/dependencies/openMode/oneOf/4/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema15.dependencies.openMode.oneOf[4].properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema15.dependencies.openMode.oneOf[4].properties.openMode.enum,parentSchema:schema15.dependencies.openMode.oneOf[4].properties.openMode,data:data25};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
}
if(data.title !== undefined){
let data26 = data.title;
if(typeof data26 !== "string"){
const err53 = {instancePath:instancePath+"/title",schemaPath:"#/dependencies/openMode/oneOf/4/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[4].properties.title.type,parentSchema:schema15.dependencies.openMode.oneOf[4].properties.title,data:data26};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data.iconUrl !== undefined){
let data27 = data.iconUrl;
if(typeof data27 !== "string"){
const err54 = {instancePath:instancePath+"/iconUrl",schemaPath:"#/dependencies/openMode/oneOf/4/properties/iconUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[4].properties.iconUrl.type,parentSchema:schema15.dependencies.openMode.oneOf[4].properties.iconUrl,data:data27};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
}
var _valid0 = _errs66 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 4];
}
else {
if(_valid0){
valid1 = true;
passing0 = 4;
}
const _errs72 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.copyOption === undefined){
const err55 = {instancePath,schemaPath:"#/dependencies/openMode/oneOf/5/required",keyword:"required",params:{missingProperty: "copyOption"},message:"must have required property '"+"copyOption"+"'",schema:schema15.dependencies.openMode.oneOf[5].required,parentSchema:schema15.dependencies.openMode.oneOf[5],data};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(data.openMode !== undefined){
let data28 = data.openMode;
if(!(data28 === "copy")){
const err56 = {instancePath:instancePath+"/openMode",schemaPath:"#/dependencies/openMode/oneOf/5/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema15.dependencies.openMode.oneOf[5].properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema15.dependencies.openMode.oneOf[5].properties.openMode.enum,parentSchema:schema15.dependencies.openMode.oneOf[5].properties.openMode,data:data28};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data.copyOption !== undefined){
let data29 = data.copyOption;
if(typeof data29 !== "string"){
const err57 = {instancePath:instancePath+"/copyOption",schemaPath:"#/dependencies/openMode/oneOf/5/properties/copyOption/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[5].properties.copyOption.type,parentSchema:schema15.dependencies.openMode.oneOf[5].properties.copyOption,data:data29};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(!((data29 === "default") || (data29 === "text"))){
const err58 = {instancePath:instancePath+"/copyOption",schemaPath:"#/dependencies/openMode/oneOf/5/properties/copyOption/enum",keyword:"enum",params:{allowedValues: schema15.dependencies.openMode.oneOf[5].properties.copyOption.enum},message:"must be equal to one of the allowed values",schema:schema15.dependencies.openMode.oneOf[5].properties.copyOption.enum,parentSchema:schema15.dependencies.openMode.oneOf[5].properties.copyOption,data:data29};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data.title !== undefined){
let data30 = data.title;
if(typeof data30 !== "string"){
const err59 = {instancePath:instancePath+"/title",schemaPath:"#/dependencies/openMode/oneOf/5/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[5].properties.title.type,parentSchema:schema15.dependencies.openMode.oneOf[5].properties.title,data:data30};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
}
if(data.iconUrl !== undefined){
let data31 = data.iconUrl;
if(typeof data31 !== "string"){
const err60 = {instancePath:instancePath+"/iconUrl",schemaPath:"#/dependencies/openMode/oneOf/5/properties/iconUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[5].properties.iconUrl.type,parentSchema:schema15.dependencies.openMode.oneOf[5].properties.iconUrl,data:data31};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
}
var _valid0 = _errs72 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 5];
}
else {
if(_valid0){
valid1 = true;
passing0 = 5;
}
const _errs80 = errors;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.openMode !== undefined){
let data32 = data.openMode;
if(!(data32 === "getTextStyles")){
const err61 = {instancePath:instancePath+"/openMode",schemaPath:"#/dependencies/openMode/oneOf/6/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema15.dependencies.openMode.oneOf[6].properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema15.dependencies.openMode.oneOf[6].properties.openMode.enum,parentSchema:schema15.dependencies.openMode.oneOf[6].properties.openMode,data:data32};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
if(data.title !== undefined){
let data33 = data.title;
if(typeof data33 !== "string"){
const err62 = {instancePath:instancePath+"/title",schemaPath:"#/dependencies/openMode/oneOf/6/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[6].properties.title.type,parentSchema:schema15.dependencies.openMode.oneOf[6].properties.title,data:data33};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data.iconUrl !== undefined){
let data34 = data.iconUrl;
if(typeof data34 !== "string"){
const err63 = {instancePath:instancePath+"/iconUrl",schemaPath:"#/dependencies/openMode/oneOf/6/properties/iconUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.dependencies.openMode.oneOf[6].properties.iconUrl.type,parentSchema:schema15.dependencies.openMode.oneOf[6].properties.iconUrl,data:data34};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
}
}
var _valid0 = _errs80 === errors;
if(_valid0 && valid1){
valid1 = false;
passing0 = [passing0, 6];
}
else {
if(_valid0){
valid1 = true;
passing0 = 6;
}
}
}
}
}
}
}
if(!valid1){
const err64 = {instancePath,schemaPath:"#/dependencies/openMode/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema15.dependencies.openMode.oneOf,parentSchema:schema15.dependencies.openMode,data};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
else {
errors = _errs3;
if(vErrors !== null){
if(_errs3){
vErrors.length = _errs3;
}
else {
vErrors = null;
}
}
}
}
if(data.title !== undefined){
let data35 = data.title;
if(typeof data35 !== "string"){
const err65 = {instancePath:instancePath+"/title",schemaPath:"#/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.properties.title.type,parentSchema:schema15.properties.title,data:data35};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
}
if(data.openMode !== undefined){
let data36 = data.openMode;
if(typeof data36 !== "string"){
const err66 = {instancePath:instancePath+"/openMode",schemaPath:"#/definitions/openMode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema25.type,parentSchema:schema25,data:data36};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
if(!(((((((data36 === "popup") || (data36 === "window")) || (data36 === "tab")) || (data36 === "api")) || (data36 === "linkPopup")) || (data36 === "copy")) || (data36 === "getTextStyles"))){
const err67 = {instancePath:instancePath+"/openMode",schemaPath:"#/definitions/openMode/enum",keyword:"enum",params:{allowedValues: schema25.enum},message:"must be equal to one of the allowed values",schema:schema25.enum,parentSchema:schema25,data:data36};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
if(data.iconUrl !== undefined){
let data37 = data.iconUrl;
if(typeof data37 !== "string"){
const err68 = {instancePath:instancePath+"/iconUrl",schemaPath:"#/properties/iconUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema15.properties.iconUrl.type,parentSchema:schema15.properties.iconUrl,data:data37};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
if(data.parentFolderId !== undefined){
let data38 = data.parentFolderId;
const vSchema15 = schema26.enum;
if(!(func0(data38, vSchema15[0]))){
const err69 = {instancePath:instancePath+"/parentFolderId",schemaPath:"#/definitions/folderOptions/enum",keyword:"enum",params:{allowedValues: schema26.enum},message:"must be equal to one of the allowed values",schema:schema26.enum,parentSchema:schema26,data:data38};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
}
else {
const err70 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema15.type,parentSchema:schema15,data};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
validate13.errors = vErrors;
return errors === 0;
}


function validate10(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="-1d18ab07" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.startupMethod === undefined){
const err0 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "startupMethod"},message:"must have required property '"+"startupMethod"+"'",schema:schema11.required,parentSchema:schema11,data};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
if(data.commands === undefined){
const err1 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "commands"},message:"must have required property '"+"commands"+"'",schema:schema11.required,parentSchema:schema11,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
if(data.popupPlacement === undefined){
const err2 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "popupPlacement"},message:"must have required property '"+"popupPlacement"+"'",schema:schema11.required,parentSchema:schema11,data};
if(vErrors === null){
vErrors = [err2];
}
else {
vErrors.push(err2);
}
errors++;
}
if(data.style === undefined){
const err3 = {instancePath,schemaPath:"#/required",keyword:"required",params:{missingProperty: "style"},message:"must have required property '"+"style"+"'",schema:schema11.required,parentSchema:schema11,data};
if(vErrors === null){
vErrors = [err3];
}
else {
vErrors.push(err3);
}
errors++;
}
if(data.startupMethod !== undefined){
if(!(validate11(data.startupMethod, {instancePath:instancePath+"/startupMethod",parentData:data,parentDataProperty:"startupMethod",rootData}))){
vErrors = vErrors === null ? validate11.errors : vErrors.concat(validate11.errors);
errors = vErrors.length;
}
}
if(data.popupPlacement !== undefined){
let data1 = data.popupPlacement;
if(typeof data1 !== "string"){
const err4 = {instancePath:instancePath+"/popupPlacement",schemaPath:"#/definitions/popupPlacement/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema14.type,parentSchema:schema14,data:data1};
if(vErrors === null){
vErrors = [err4];
}
else {
vErrors.push(err4);
}
errors++;
}
if(!((((((data1 === "top") || (data1 === "top-start")) || (data1 === "top-end")) || (data1 === "bottom")) || (data1 === "bottom-start")) || (data1 === "bottom-end"))){
const err5 = {instancePath:instancePath+"/popupPlacement",schemaPath:"#/definitions/popupPlacement/enum",keyword:"enum",params:{allowedValues: schema14.enum},message:"must be equal to one of the allowed values",schema:schema14.enum,parentSchema:schema14,data:data1};
if(vErrors === null){
vErrors = [err5];
}
else {
vErrors.push(err5);
}
errors++;
}
}
if(data.style !== undefined){
let data2 = data.style;
if(typeof data2 !== "string"){
const err6 = {instancePath:instancePath+"/style",schemaPath:"#/properties/style/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema11.properties.style.type,parentSchema:schema11.properties.style,data:data2};
if(vErrors === null){
vErrors = [err6];
}
else {
vErrors.push(err6);
}
errors++;
}
if(!((data2 === "vertical") || (data2 === "horizontal"))){
const err7 = {instancePath:instancePath+"/style",schemaPath:"#/properties/style/enum",keyword:"enum",params:{allowedValues: schema11.properties.style.enum},message:"must be equal to one of the allowed values",schema:schema11.properties.style.enum,parentSchema:schema11.properties.style,data:data2};
if(vErrors === null){
vErrors = [err7];
}
else {
vErrors.push(err7);
}
errors++;
}
}
if(data.commands !== undefined){
let data3 = data.commands;
if(Array.isArray(data3)){
if(data3.length > 100){
const err8 = {instancePath:instancePath+"/commands",schemaPath:"#/properties/commands/maxItems",keyword:"maxItems",params:{limit: 100},message:"must NOT have more than 100 items",schema:100,parentSchema:schema11.properties.commands,data:data3};
if(vErrors === null){
vErrors = [err8];
}
else {
vErrors.push(err8);
}
errors++;
}
if(data3.length < 1){
const err9 = {instancePath:instancePath+"/commands",schemaPath:"#/properties/commands/minItems",keyword:"minItems",params:{limit: 1},message:"must NOT have fewer than 1 items",schema:1,parentSchema:schema11.properties.commands,data:data3};
if(vErrors === null){
vErrors = [err9];
}
else {
vErrors.push(err9);
}
errors++;
}
const len0 = data3.length;
for(let i0=0; i0<len0; i0++){
if(!(validate13(data3[i0], {instancePath:instancePath+"/commands/" + i0,parentData:data3,parentDataProperty:i0,rootData}))){
vErrors = vErrors === null ? validate13.errors : vErrors.concat(validate13.errors);
errors = vErrors.length;
}
}
}
else {
const err10 = {instancePath:instancePath+"/commands",schemaPath:"#/properties/commands/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema11.properties.commands.type,parentSchema:schema11.properties.commands,data:data3};
if(vErrors === null){
vErrors = [err10];
}
else {
vErrors.push(err10);
}
errors++;
}
}
if(data.folders !== undefined){
let data5 = data.folders;
if(Array.isArray(data5)){
const len1 = data5.length;
for(let i1=0; i1<len1; i1++){
let data6 = data5[i1];
if(data6 && typeof data6 == "object" && !Array.isArray(data6)){
if(data6.title === undefined){
const err11 = {instancePath:instancePath+"/folders/" + i1,schemaPath:"#/definitions/commandFolder/required",keyword:"required",params:{missingProperty: "title"},message:"must have required property '"+"title"+"'",schema:schema27.required,parentSchema:schema27,data:data6};
if(vErrors === null){
vErrors = [err11];
}
else {
vErrors.push(err11);
}
errors++;
}
for(const key0 in data6){
if(!((((key0 === "id") || (key0 === "title")) || (key0 === "iconUrl")) || (key0 === "onlyIcon"))){
const err12 = {instancePath:instancePath+"/folders/" + i1,schemaPath:"#/definitions/commandFolder/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key0},message:"must NOT have additional properties",schema:false,parentSchema:schema27,data:data6};
if(vErrors === null){
vErrors = [err12];
}
else {
vErrors.push(err12);
}
errors++;
}
}
if(data6.id !== undefined){
let data7 = data6.id;
if(typeof data7 !== "string"){
const err13 = {instancePath:instancePath+"/folders/" + i1+"/id",schemaPath:"#/definitions/commandFolder/properties/id/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.id.type,parentSchema:schema27.properties.id,data:data7};
if(vErrors === null){
vErrors = [err13];
}
else {
vErrors.push(err13);
}
errors++;
}
}
if(data6.title !== undefined){
let data8 = data6.title;
if(typeof data8 !== "string"){
const err14 = {instancePath:instancePath+"/folders/" + i1+"/title",schemaPath:"#/definitions/commandFolder/properties/title/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.title.type,parentSchema:schema27.properties.title,data:data8};
if(vErrors === null){
vErrors = [err14];
}
else {
vErrors.push(err14);
}
errors++;
}
}
if(data6.iconUrl !== undefined){
let data9 = data6.iconUrl;
if(typeof data9 !== "string"){
const err15 = {instancePath:instancePath+"/folders/" + i1+"/iconUrl",schemaPath:"#/definitions/commandFolder/properties/iconUrl/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema27.properties.iconUrl.type,parentSchema:schema27.properties.iconUrl,data:data9};
if(vErrors === null){
vErrors = [err15];
}
else {
vErrors.push(err15);
}
errors++;
}
}
if(data6.onlyIcon !== undefined){
let data10 = data6.onlyIcon;
if(typeof data10 !== "boolean"){
const err16 = {instancePath:instancePath+"/folders/" + i1+"/onlyIcon",schemaPath:"#/definitions/commandFolder/properties/onlyIcon/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema27.properties.onlyIcon.type,parentSchema:schema27.properties.onlyIcon,data:data10};
if(vErrors === null){
vErrors = [err16];
}
else {
vErrors.push(err16);
}
errors++;
}
}
}
else {
const err17 = {instancePath:instancePath+"/folders/" + i1,schemaPath:"#/definitions/commandFolder/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema27.type,parentSchema:schema27,data:data6};
if(vErrors === null){
vErrors = [err17];
}
else {
vErrors.push(err17);
}
errors++;
}
}
}
else {
const err18 = {instancePath:instancePath+"/folders",schemaPath:"#/properties/folders/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema11.properties.folders.type,parentSchema:schema11.properties.folders,data:data5};
if(vErrors === null){
vErrors = [err18];
}
else {
vErrors.push(err18);
}
errors++;
}
}
if(data.linkCommand !== undefined){
let data11 = data.linkCommand;
if(data11 && typeof data11 == "object" && !Array.isArray(data11)){
if(data11.enabled === undefined){
const err19 = {instancePath:instancePath+"/linkCommand",schemaPath:"#/properties/linkCommand/required",keyword:"required",params:{missingProperty: "enabled"},message:"must have required property '"+"enabled"+"'",schema:schema11.properties.linkCommand.required,parentSchema:schema11.properties.linkCommand,data:data11};
if(vErrors === null){
vErrors = [err19];
}
else {
vErrors.push(err19);
}
errors++;
}
if(data11.openMode === undefined){
const err20 = {instancePath:instancePath+"/linkCommand",schemaPath:"#/properties/linkCommand/required",keyword:"required",params:{missingProperty: "openMode"},message:"must have required property '"+"openMode"+"'",schema:schema11.properties.linkCommand.required,parentSchema:schema11.properties.linkCommand,data:data11};
if(vErrors === null){
vErrors = [err20];
}
else {
vErrors.push(err20);
}
errors++;
}
if(data11.showIndicator === undefined){
const err21 = {instancePath:instancePath+"/linkCommand",schemaPath:"#/properties/linkCommand/required",keyword:"required",params:{missingProperty: "showIndicator"},message:"must have required property '"+"showIndicator"+"'",schema:schema11.properties.linkCommand.required,parentSchema:schema11.properties.linkCommand,data:data11};
if(vErrors === null){
vErrors = [err21];
}
else {
vErrors.push(err21);
}
errors++;
}
for(const key1 in data11){
if(!((((key1 === "enabled") || (key1 === "openMode")) || (key1 === "showIndicator")) || (key1 === "startupMethod"))){
const err22 = {instancePath:instancePath+"/linkCommand",schemaPath:"#/properties/linkCommand/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key1},message:"must NOT have additional properties",schema:false,parentSchema:schema11.properties.linkCommand,data:data11};
if(vErrors === null){
vErrors = [err22];
}
else {
vErrors.push(err22);
}
errors++;
}
}
if(data11.enabled !== undefined){
let data12 = data11.enabled;
if(typeof data12 !== "string"){
const err23 = {instancePath:instancePath+"/linkCommand/enabled",schemaPath:"#/properties/linkCommand/properties/enabled/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema11.properties.linkCommand.properties.enabled.type,parentSchema:schema11.properties.linkCommand.properties.enabled,data:data12};
if(vErrors === null){
vErrors = [err23];
}
else {
vErrors.push(err23);
}
errors++;
}
if(!((data12 === "Enable") || (data12 === "Disable"))){
const err24 = {instancePath:instancePath+"/linkCommand/enabled",schemaPath:"#/properties/linkCommand/properties/enabled/enum",keyword:"enum",params:{allowedValues: schema11.properties.linkCommand.properties.enabled.enum},message:"must be equal to one of the allowed values",schema:schema11.properties.linkCommand.properties.enabled.enum,parentSchema:schema11.properties.linkCommand.properties.enabled,data:data12};
if(vErrors === null){
vErrors = [err24];
}
else {
vErrors.push(err24);
}
errors++;
}
}
if(data11.openMode !== undefined){
let data13 = data11.openMode;
if(typeof data13 !== "string"){
const err25 = {instancePath:instancePath+"/linkCommand/openMode",schemaPath:"#/properties/linkCommand/properties/openMode/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema11.properties.linkCommand.properties.openMode.type,parentSchema:schema11.properties.linkCommand.properties.openMode,data:data13};
if(vErrors === null){
vErrors = [err25];
}
else {
vErrors.push(err25);
}
errors++;
}
if(!((data13 === "previewPopup") || (data13 === "previewWindow"))){
const err26 = {instancePath:instancePath+"/linkCommand/openMode",schemaPath:"#/properties/linkCommand/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema11.properties.linkCommand.properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema11.properties.linkCommand.properties.openMode.enum,parentSchema:schema11.properties.linkCommand.properties.openMode,data:data13};
if(vErrors === null){
vErrors = [err26];
}
else {
vErrors.push(err26);
}
errors++;
}
}
if(data11.showIndicator !== undefined){
let data14 = data11.showIndicator;
if(typeof data14 !== "boolean"){
const err27 = {instancePath:instancePath+"/linkCommand/showIndicator",schemaPath:"#/properties/linkCommand/properties/showIndicator/type",keyword:"type",params:{type: "boolean"},message:"must be boolean",schema:schema11.properties.linkCommand.properties.showIndicator.type,parentSchema:schema11.properties.linkCommand.properties.showIndicator,data:data14};
if(vErrors === null){
vErrors = [err27];
}
else {
vErrors.push(err27);
}
errors++;
}
}
if(data11.startupMethod !== undefined){
let data15 = data11.startupMethod;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.method === undefined){
const err28 = {instancePath:instancePath+"/linkCommand/startupMethod",schemaPath:"#/definitions/linkCommandStartupMethod/required",keyword:"required",params:{missingProperty: "method"},message:"must have required property '"+"method"+"'",schema:schema28.required,parentSchema:schema28,data:data15};
if(vErrors === null){
vErrors = [err28];
}
else {
vErrors.push(err28);
}
errors++;
}
for(const key2 in data15){
if(!(key2 === "method")){
const err29 = {instancePath:instancePath+"/linkCommand/startupMethod",schemaPath:"#/definitions/linkCommandStartupMethod/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key2},message:"must NOT have additional properties",schema:false,parentSchema:schema28,data:data15};
if(vErrors === null){
vErrors = [err29];
}
else {
vErrors.push(err29);
}
errors++;
}
}
if(data15.method !== undefined){
const _errs38 = errors;
let valid11 = false;
let passing0 = null;
const _errs39 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.keyboardParam === undefined){
const err30 = {instancePath:instancePath+"/linkCommand/startupMethod",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/0/required",keyword:"required",params:{missingProperty: "keyboardParam"},message:"must have required property '"+"keyboardParam"+"'",schema:schema28.dependencies.method.oneOf[0].required,parentSchema:schema28.dependencies.method.oneOf[0],data:data15};
if(vErrors === null){
vErrors = [err30];
}
else {
vErrors.push(err30);
}
errors++;
}
if(data15.method !== undefined){
let data16 = data15.method;
if(!(data16 === "keyboard")){
const err31 = {instancePath:instancePath+"/linkCommand/startupMethod/method",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/0/properties/method/enum",keyword:"enum",params:{allowedValues: schema28.dependencies.method.oneOf[0].properties.method.enum},message:"must be equal to one of the allowed values",schema:schema28.dependencies.method.oneOf[0].properties.method.enum,parentSchema:schema28.dependencies.method.oneOf[0].properties.method,data:data16};
if(vErrors === null){
vErrors = [err31];
}
else {
vErrors.push(err31);
}
errors++;
}
}
if(data15.keyboardParam !== undefined){
let data17 = data15.keyboardParam;
if(typeof data17 !== "string"){
const err32 = {instancePath:instancePath+"/linkCommand/startupMethod/keyboardParam",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/0/properties/keyboardParam/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.dependencies.method.oneOf[0].properties.keyboardParam.type,parentSchema:schema28.dependencies.method.oneOf[0].properties.keyboardParam,data:data17};
if(vErrors === null){
vErrors = [err32];
}
else {
vErrors.push(err32);
}
errors++;
}
if(!(((data17 === "Shift") || (data17 === "Alt")) || (data17 === "Control"))){
const err33 = {instancePath:instancePath+"/linkCommand/startupMethod/keyboardParam",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/0/properties/keyboardParam/enum",keyword:"enum",params:{allowedValues: schema28.dependencies.method.oneOf[0].properties.keyboardParam.enum},message:"must be equal to one of the allowed values",schema:schema28.dependencies.method.oneOf[0].properties.keyboardParam.enum,parentSchema:schema28.dependencies.method.oneOf[0].properties.keyboardParam,data:data17};
if(vErrors === null){
vErrors = [err33];
}
else {
vErrors.push(err33);
}
errors++;
}
}
}
var _valid0 = _errs39 === errors;
if(_valid0){
valid11 = true;
passing0 = 0;
}
const _errs43 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.threshold === undefined){
const err34 = {instancePath:instancePath+"/linkCommand/startupMethod",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/1/required",keyword:"required",params:{missingProperty: "threshold"},message:"must have required property '"+"threshold"+"'",schema:schema28.dependencies.method.oneOf[1].required,parentSchema:schema28.dependencies.method.oneOf[1],data:data15};
if(vErrors === null){
vErrors = [err34];
}
else {
vErrors.push(err34);
}
errors++;
}
if(data15.method !== undefined){
let data18 = data15.method;
if(!(data18 === "drag")){
const err35 = {instancePath:instancePath+"/linkCommand/startupMethod/method",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/1/properties/method/enum",keyword:"enum",params:{allowedValues: schema28.dependencies.method.oneOf[1].properties.method.enum},message:"must be equal to one of the allowed values",schema:schema28.dependencies.method.oneOf[1].properties.method.enum,parentSchema:schema28.dependencies.method.oneOf[1].properties.method,data:data18};
if(vErrors === null){
vErrors = [err35];
}
else {
vErrors.push(err35);
}
errors++;
}
}
if(data15.threshold !== undefined){
let data19 = data15.threshold;
if(typeof data19 == "number"){
if(data19 > 400 || isNaN(data19)){
const err36 = {instancePath:instancePath+"/linkCommand/startupMethod/threshold",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/1/properties/threshold/maximum",keyword:"maximum",params:{comparison: "<=", limit: 400},message:"must be <= 400",schema:400,parentSchema:schema28.dependencies.method.oneOf[1].properties.threshold,data:data19};
if(vErrors === null){
vErrors = [err36];
}
else {
vErrors.push(err36);
}
errors++;
}
if(data19 < 50 || isNaN(data19)){
const err37 = {instancePath:instancePath+"/linkCommand/startupMethod/threshold",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/1/properties/threshold/minimum",keyword:"minimum",params:{comparison: ">=", limit: 50},message:"must be >= 50",schema:50,parentSchema:schema28.dependencies.method.oneOf[1].properties.threshold,data:data19};
if(vErrors === null){
vErrors = [err37];
}
else {
vErrors.push(err37);
}
errors++;
}
}
else {
const err38 = {instancePath:instancePath+"/linkCommand/startupMethod/threshold",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/1/properties/threshold/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.dependencies.method.oneOf[1].properties.threshold.type,parentSchema:schema28.dependencies.method.oneOf[1].properties.threshold,data:data19};
if(vErrors === null){
vErrors = [err38];
}
else {
vErrors.push(err38);
}
errors++;
}
}
}
var _valid0 = _errs43 === errors;
if(_valid0 && valid11){
valid11 = false;
passing0 = [passing0, 1];
}
else {
if(_valid0){
valid11 = true;
passing0 = 1;
}
const _errs47 = errors;
if(data15 && typeof data15 == "object" && !Array.isArray(data15)){
if(data15.leftClickHoldParam === undefined){
const err39 = {instancePath:instancePath+"/linkCommand/startupMethod",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/2/required",keyword:"required",params:{missingProperty: "leftClickHoldParam"},message:"must have required property '"+"leftClickHoldParam"+"'",schema:schema28.dependencies.method.oneOf[2].required,parentSchema:schema28.dependencies.method.oneOf[2],data:data15};
if(vErrors === null){
vErrors = [err39];
}
else {
vErrors.push(err39);
}
errors++;
}
if(data15.method !== undefined){
let data20 = data15.method;
if(!(data20 === "leftClickHold")){
const err40 = {instancePath:instancePath+"/linkCommand/startupMethod/method",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/2/properties/method/enum",keyword:"enum",params:{allowedValues: schema28.dependencies.method.oneOf[2].properties.method.enum},message:"must be equal to one of the allowed values",schema:schema28.dependencies.method.oneOf[2].properties.method.enum,parentSchema:schema28.dependencies.method.oneOf[2].properties.method,data:data20};
if(vErrors === null){
vErrors = [err40];
}
else {
vErrors.push(err40);
}
errors++;
}
}
if(data15.leftClickHoldParam !== undefined){
let data21 = data15.leftClickHoldParam;
if(typeof data21 == "number"){
if(data21 > 500 || isNaN(data21)){
const err41 = {instancePath:instancePath+"/linkCommand/startupMethod/leftClickHoldParam",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/2/properties/leftClickHoldParam/maximum",keyword:"maximum",params:{comparison: "<=", limit: 500},message:"must be <= 500",schema:500,parentSchema:schema28.dependencies.method.oneOf[2].properties.leftClickHoldParam,data:data21};
if(vErrors === null){
vErrors = [err41];
}
else {
vErrors.push(err41);
}
errors++;
}
if(data21 < 50 || isNaN(data21)){
const err42 = {instancePath:instancePath+"/linkCommand/startupMethod/leftClickHoldParam",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/2/properties/leftClickHoldParam/minimum",keyword:"minimum",params:{comparison: ">=", limit: 50},message:"must be >= 50",schema:50,parentSchema:schema28.dependencies.method.oneOf[2].properties.leftClickHoldParam,data:data21};
if(vErrors === null){
vErrors = [err42];
}
else {
vErrors.push(err42);
}
errors++;
}
}
else {
const err43 = {instancePath:instancePath+"/linkCommand/startupMethod/leftClickHoldParam",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf/2/properties/leftClickHoldParam/type",keyword:"type",params:{type: "number"},message:"must be number",schema:schema28.dependencies.method.oneOf[2].properties.leftClickHoldParam.type,parentSchema:schema28.dependencies.method.oneOf[2].properties.leftClickHoldParam,data:data21};
if(vErrors === null){
vErrors = [err43];
}
else {
vErrors.push(err43);
}
errors++;
}
}
}
var _valid0 = _errs47 === errors;
if(_valid0 && valid11){
valid11 = false;
passing0 = [passing0, 2];
}
else {
if(_valid0){
valid11 = true;
passing0 = 2;
}
}
}
if(!valid11){
const err44 = {instancePath:instancePath+"/linkCommand/startupMethod",schemaPath:"#/definitions/linkCommandStartupMethod/dependencies/method/oneOf",keyword:"oneOf",params:{passingSchemas: passing0},message:"must match exactly one schema in oneOf",schema:schema28.dependencies.method.oneOf,parentSchema:schema28.dependencies.method,data:data15};
if(vErrors === null){
vErrors = [err44];
}
else {
vErrors.push(err44);
}
errors++;
}
else {
errors = _errs38;
if(vErrors !== null){
if(_errs38){
vErrors.length = _errs38;
}
else {
vErrors = null;
}
}
}
}
if(data15.method !== undefined){
let data22 = data15.method;
if(typeof data22 !== "string"){
const err45 = {instancePath:instancePath+"/linkCommand/startupMethod/method",schemaPath:"#/definitions/linkCommandStartupMethod/properties/method/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema28.properties.method.type,parentSchema:schema28.properties.method,data:data22};
if(vErrors === null){
vErrors = [err45];
}
else {
vErrors.push(err45);
}
errors++;
}
if(!(((data22 === "keyboard") || (data22 === "drag")) || (data22 === "leftClickHold"))){
const err46 = {instancePath:instancePath+"/linkCommand/startupMethod/method",schemaPath:"#/definitions/linkCommandStartupMethod/properties/method/enum",keyword:"enum",params:{allowedValues: schema28.properties.method.enum},message:"must be equal to one of the allowed values",schema:schema28.properties.method.enum,parentSchema:schema28.properties.method,data:data22};
if(vErrors === null){
vErrors = [err46];
}
else {
vErrors.push(err46);
}
errors++;
}
}
}
else {
const err47 = {instancePath:instancePath+"/linkCommand/startupMethod",schemaPath:"#/definitions/linkCommandStartupMethod/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema28.type,parentSchema:schema28,data:data15};
if(vErrors === null){
vErrors = [err47];
}
else {
vErrors.push(err47);
}
errors++;
}
}
}
else {
const err48 = {instancePath:instancePath+"/linkCommand",schemaPath:"#/properties/linkCommand/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema11.properties.linkCommand.type,parentSchema:schema11.properties.linkCommand,data:data11};
if(vErrors === null){
vErrors = [err48];
}
else {
vErrors.push(err48);
}
errors++;
}
}
if(data.pageRules !== undefined){
let data23 = data.pageRules;
if(Array.isArray(data23)){
const len2 = data23.length;
for(let i2=0; i2<len2; i2++){
let data24 = data23[i2];
if(data24 && typeof data24 == "object" && !Array.isArray(data24)){
if(data24.urlPattern === undefined){
const err49 = {instancePath:instancePath+"/pageRules/" + i2,schemaPath:"#/properties/pageRules/items/required",keyword:"required",params:{missingProperty: "urlPattern"},message:"must have required property '"+"urlPattern"+"'",schema:schema11.properties.pageRules.items.required,parentSchema:schema11.properties.pageRules.items,data:data24};
if(vErrors === null){
vErrors = [err49];
}
else {
vErrors.push(err49);
}
errors++;
}
if(data24.popupEnabled === undefined){
const err50 = {instancePath:instancePath+"/pageRules/" + i2,schemaPath:"#/properties/pageRules/items/required",keyword:"required",params:{missingProperty: "popupEnabled"},message:"must have required property '"+"popupEnabled"+"'",schema:schema11.properties.pageRules.items.required,parentSchema:schema11.properties.pageRules.items,data:data24};
if(vErrors === null){
vErrors = [err50];
}
else {
vErrors.push(err50);
}
errors++;
}
if(data24.popupPlacement === undefined){
const err51 = {instancePath:instancePath+"/pageRules/" + i2,schemaPath:"#/properties/pageRules/items/required",keyword:"required",params:{missingProperty: "popupPlacement"},message:"must have required property '"+"popupPlacement"+"'",schema:schema11.properties.pageRules.items.required,parentSchema:schema11.properties.pageRules.items,data:data24};
if(vErrors === null){
vErrors = [err51];
}
else {
vErrors.push(err51);
}
errors++;
}
if(data24.linkCommandEnabled === undefined){
const err52 = {instancePath:instancePath+"/pageRules/" + i2,schemaPath:"#/properties/pageRules/items/required",keyword:"required",params:{missingProperty: "linkCommandEnabled"},message:"must have required property '"+"linkCommandEnabled"+"'",schema:schema11.properties.pageRules.items.required,parentSchema:schema11.properties.pageRules.items,data:data24};
if(vErrors === null){
vErrors = [err52];
}
else {
vErrors.push(err52);
}
errors++;
}
for(const key3 in data24){
if(!((((key3 === "urlPattern") || (key3 === "popupEnabled")) || (key3 === "popupPlacement")) || (key3 === "linkCommandEnabled"))){
const err53 = {instancePath:instancePath+"/pageRules/" + i2,schemaPath:"#/properties/pageRules/items/additionalProperties",keyword:"additionalProperties",params:{additionalProperty: key3},message:"must NOT have additional properties",schema:false,parentSchema:schema11.properties.pageRules.items,data:data24};
if(vErrors === null){
vErrors = [err53];
}
else {
vErrors.push(err53);
}
errors++;
}
}
if(data24.urlPattern !== undefined){
let data25 = data24.urlPattern;
if(typeof data25 !== "string"){
const err54 = {instancePath:instancePath+"/pageRules/" + i2+"/urlPattern",schemaPath:"#/properties/pageRules/items/properties/urlPattern/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema11.properties.pageRules.items.properties.urlPattern.type,parentSchema:schema11.properties.pageRules.items.properties.urlPattern,data:data25};
if(vErrors === null){
vErrors = [err54];
}
else {
vErrors.push(err54);
}
errors++;
}
}
if(data24.popupEnabled !== undefined){
let data26 = data24.popupEnabled;
if(typeof data26 !== "string"){
const err55 = {instancePath:instancePath+"/pageRules/" + i2+"/popupEnabled",schemaPath:"#/properties/pageRules/items/properties/popupEnabled/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema11.properties.pageRules.items.properties.popupEnabled.type,parentSchema:schema11.properties.pageRules.items.properties.popupEnabled,data:data26};
if(vErrors === null){
vErrors = [err55];
}
else {
vErrors.push(err55);
}
errors++;
}
if(!((data26 === "Enable") || (data26 === "Disable"))){
const err56 = {instancePath:instancePath+"/pageRules/" + i2+"/popupEnabled",schemaPath:"#/properties/pageRules/items/properties/popupEnabled/enum",keyword:"enum",params:{allowedValues: schema11.properties.pageRules.items.properties.popupEnabled.enum},message:"must be equal to one of the allowed values",schema:schema11.properties.pageRules.items.properties.popupEnabled.enum,parentSchema:schema11.properties.pageRules.items.properties.popupEnabled,data:data26};
if(vErrors === null){
vErrors = [err56];
}
else {
vErrors.push(err56);
}
errors++;
}
}
if(data24.popupPlacement !== undefined){
let data27 = data24.popupPlacement;
if(typeof data27 !== "string"){
const err57 = {instancePath:instancePath+"/pageRules/" + i2+"/popupPlacement",schemaPath:"#/definitions/popupPlacement/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema14.type,parentSchema:schema14,data:data27};
if(vErrors === null){
vErrors = [err57];
}
else {
vErrors.push(err57);
}
errors++;
}
if(!((((((data27 === "top") || (data27 === "top-start")) || (data27 === "top-end")) || (data27 === "bottom")) || (data27 === "bottom-start")) || (data27 === "bottom-end"))){
const err58 = {instancePath:instancePath+"/pageRules/" + i2+"/popupPlacement",schemaPath:"#/definitions/popupPlacement/enum",keyword:"enum",params:{allowedValues: schema14.enum},message:"must be equal to one of the allowed values",schema:schema14.enum,parentSchema:schema14,data:data27};
if(vErrors === null){
vErrors = [err58];
}
else {
vErrors.push(err58);
}
errors++;
}
}
if(data24.linkCommandEnabled !== undefined){
let data28 = data24.linkCommandEnabled;
if(typeof data28 !== "string"){
const err59 = {instancePath:instancePath+"/pageRules/" + i2+"/linkCommandEnabled",schemaPath:"#/properties/pageRules/items/properties/linkCommandEnabled/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema11.properties.pageRules.items.properties.linkCommandEnabled.type,parentSchema:schema11.properties.pageRules.items.properties.linkCommandEnabled,data:data28};
if(vErrors === null){
vErrors = [err59];
}
else {
vErrors.push(err59);
}
errors++;
}
if(!(((data28 === "Inherit") || (data28 === "Enable")) || (data28 === "Disable"))){
const err60 = {instancePath:instancePath+"/pageRules/" + i2+"/linkCommandEnabled",schemaPath:"#/properties/pageRules/items/properties/linkCommandEnabled/enum",keyword:"enum",params:{allowedValues: schema11.properties.pageRules.items.properties.linkCommandEnabled.enum},message:"must be equal to one of the allowed values",schema:schema11.properties.pageRules.items.properties.linkCommandEnabled.enum,parentSchema:schema11.properties.pageRules.items.properties.linkCommandEnabled,data:data28};
if(vErrors === null){
vErrors = [err60];
}
else {
vErrors.push(err60);
}
errors++;
}
}
}
else {
const err61 = {instancePath:instancePath+"/pageRules/" + i2,schemaPath:"#/properties/pageRules/items/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema11.properties.pageRules.items.type,parentSchema:schema11.properties.pageRules.items,data:data24};
if(vErrors === null){
vErrors = [err61];
}
else {
vErrors.push(err61);
}
errors++;
}
}
}
else {
const err62 = {instancePath:instancePath+"/pageRules",schemaPath:"#/properties/pageRules/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema11.properties.pageRules.type,parentSchema:schema11.properties.pageRules,data:data23};
if(vErrors === null){
vErrors = [err62];
}
else {
vErrors.push(err62);
}
errors++;
}
}
if(data.userStyles !== undefined){
let data29 = data.userStyles;
if(Array.isArray(data29)){
const len3 = data29.length;
for(let i3=0; i3<len3; i3++){
let data30 = data29[i3];
if(data30 && typeof data30 == "object" && !Array.isArray(data30)){
if(data30.name === undefined){
const err63 = {instancePath:instancePath+"/userStyles/" + i3,schemaPath:"#/definitions/styleVariable/required",keyword:"required",params:{missingProperty: "name"},message:"must have required property '"+"name"+"'",schema:schema30.required,parentSchema:schema30,data:data30};
if(vErrors === null){
vErrors = [err63];
}
else {
vErrors.push(err63);
}
errors++;
}
if(data30.value === undefined){
const err64 = {instancePath:instancePath+"/userStyles/" + i3,schemaPath:"#/definitions/styleVariable/required",keyword:"required",params:{missingProperty: "value"},message:"must have required property '"+"value"+"'",schema:schema30.required,parentSchema:schema30,data:data30};
if(vErrors === null){
vErrors = [err64];
}
else {
vErrors.push(err64);
}
errors++;
}
if(data30.name !== undefined){
let data31 = data30.name;
if(typeof data31 !== "string"){
const err65 = {instancePath:instancePath+"/userStyles/" + i3+"/name",schemaPath:"#/definitions/styleVariable/properties/name/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.properties.name.type,parentSchema:schema30.properties.name,data:data31};
if(vErrors === null){
vErrors = [err65];
}
else {
vErrors.push(err65);
}
errors++;
}
if(!(((((((data31 === "background-color") || (data31 === "border-color")) || (data31 === "font-scale")) || (data31 === "image-scale")) || (data31 === "padding-scale")) || (data31 === "popup-delay")) || (data31 === "popup-duration"))){
const err66 = {instancePath:instancePath+"/userStyles/" + i3+"/name",schemaPath:"#/definitions/styleVariable/properties/name/enum",keyword:"enum",params:{allowedValues: schema30.properties.name.enum},message:"must be equal to one of the allowed values",schema:schema30.properties.name.enum,parentSchema:schema30.properties.name,data:data31};
if(vErrors === null){
vErrors = [err66];
}
else {
vErrors.push(err66);
}
errors++;
}
}
if(data30.value !== undefined){
let data32 = data30.value;
if(typeof data32 !== "string"){
const err67 = {instancePath:instancePath+"/userStyles/" + i3+"/value",schemaPath:"#/definitions/styleVariable/properties/value/type",keyword:"type",params:{type: "string"},message:"must be string",schema:schema30.properties.value.type,parentSchema:schema30.properties.value,data:data32};
if(vErrors === null){
vErrors = [err67];
}
else {
vErrors.push(err67);
}
errors++;
}
}
}
else {
const err68 = {instancePath:instancePath+"/userStyles/" + i3,schemaPath:"#/definitions/styleVariable/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema30.type,parentSchema:schema30,data:data30};
if(vErrors === null){
vErrors = [err68];
}
else {
vErrors.push(err68);
}
errors++;
}
}
}
else {
const err69 = {instancePath:instancePath+"/userStyles",schemaPath:"#/properties/userStyles/type",keyword:"type",params:{type: "array"},message:"must be array",schema:schema11.properties.userStyles.type,parentSchema:schema11.properties.userStyles,data:data29};
if(vErrors === null){
vErrors = [err69];
}
else {
vErrors.push(err69);
}
errors++;
}
}
}
else {
const err70 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema11.type,parentSchema:schema11,data};
if(vErrors === null){
vErrors = [err70];
}
else {
vErrors.push(err70);
}
errors++;
}
validate10.errors = vErrors;
return errors === 0;
}

exports["-71ab532d"] = validate15;
const schema31 = {"type":"object","properties":{"method":{"enum":["textSelection"]}},"$id":"-71ab532d"};

function validate15(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="-71ab532d" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.method !== undefined){
let data0 = data.method;
if(!(data0 === "textSelection")){
const err0 = {instancePath:instancePath+"/method",schemaPath:"#/properties/method/enum",keyword:"enum",params:{allowedValues: schema31.properties.method.enum},message:"must be equal to one of the allowed values",schema:schema31.properties.method.enum,parentSchema:schema31.properties.method,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema31.type,parentSchema:schema31,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate15.errors = vErrors;
return errors === 0;
}

exports["-720e7a5c"] = validate16;
const schema32 = {"type":"object","properties":{"method":{"enum":["contextMenu"]}},"$id":"-720e7a5c"};

function validate16(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="-720e7a5c" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.method !== undefined){
let data0 = data.method;
if(!(data0 === "contextMenu")){
const err0 = {instancePath:instancePath+"/method",schemaPath:"#/properties/method/enum",keyword:"enum",params:{allowedValues: schema32.properties.method.enum},message:"must be equal to one of the allowed values",schema:schema32.properties.method.enum,parentSchema:schema32.properties.method,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema32.type,parentSchema:schema32,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate16.errors = vErrors;
return errors === 0;
}

exports["-2862f107"] = validate17;
const schema33 = {"type":"object","properties":{"method":{"enum":["keyboard"]}},"$id":"-2862f107"};

function validate17(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="-2862f107" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.method !== undefined){
let data0 = data.method;
if(!(data0 === "keyboard")){
const err0 = {instancePath:instancePath+"/method",schemaPath:"#/properties/method/enum",keyword:"enum",params:{allowedValues: schema33.properties.method.enum},message:"must be equal to one of the allowed values",schema:schema33.properties.method.enum,parentSchema:schema33.properties.method,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema33.type,parentSchema:schema33,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate17.errors = vErrors;
return errors === 0;
}

exports["1f9fc32"] = validate18;
const schema34 = {"type":"object","properties":{"method":{"enum":["leftClickHold"]}},"$id":"1f9fc32"};

function validate18(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="1f9fc32" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.method !== undefined){
let data0 = data.method;
if(!(data0 === "leftClickHold")){
const err0 = {instancePath:instancePath+"/method",schemaPath:"#/properties/method/enum",keyword:"enum",params:{allowedValues: schema34.properties.method.enum},message:"must be equal to one of the allowed values",schema:schema34.properties.method.enum,parentSchema:schema34.properties.method,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema34.type,parentSchema:schema34,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate18.errors = vErrors;
return errors === 0;
}

exports["-2f1e1eee"] = validate19;
const schema35 = {"type":"object","properties":{"openMode":{"enum":["popup"]}},"$id":"-2f1e1eee"};

function validate19(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="-2f1e1eee" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.openMode !== undefined){
let data0 = data.openMode;
if(!(data0 === "popup")){
const err0 = {instancePath:instancePath+"/openMode",schemaPath:"#/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema35.properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema35.properties.openMode.enum,parentSchema:schema35.properties.openMode,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema35.type,parentSchema:schema35,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate19.errors = vErrors;
return errors === 0;
}

exports["4b55ab09"] = validate20;
const schema36 = {"type":"object","properties":{"openMode":{"enum":["tab"]}},"$id":"4b55ab09"};

function validate20(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="4b55ab09" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.openMode !== undefined){
let data0 = data.openMode;
if(!(data0 === "tab")){
const err0 = {instancePath:instancePath+"/openMode",schemaPath:"#/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema36.properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema36.properties.openMode.enum,parentSchema:schema36.properties.openMode,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema36.type,parentSchema:schema36,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate20.errors = vErrors;
return errors === 0;
}

exports["1d251ee4"] = validate21;
const schema37 = {"type":"object","properties":{"openMode":{"enum":["window"]}},"$id":"1d251ee4"};

function validate21(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="1d251ee4" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.openMode !== undefined){
let data0 = data.openMode;
if(!(data0 === "window")){
const err0 = {instancePath:instancePath+"/openMode",schemaPath:"#/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema37.properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema37.properties.openMode.enum,parentSchema:schema37.properties.openMode,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema37.type,parentSchema:schema37,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate21.errors = vErrors;
return errors === 0;
}

exports["-6237da5c"] = validate22;
const schema38 = {"type":"object","properties":{"openMode":{"enum":["api"]}},"$id":"-6237da5c"};

function validate22(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="-6237da5c" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.openMode !== undefined){
let data0 = data.openMode;
if(!(data0 === "api")){
const err0 = {instancePath:instancePath+"/openMode",schemaPath:"#/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema38.properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema38.properties.openMode.enum,parentSchema:schema38.properties.openMode,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema38.type,parentSchema:schema38,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate22.errors = vErrors;
return errors === 0;
}

exports["1b2bbe2c"] = validate23;
const schema39 = {"type":"object","properties":{"openMode":{"enum":["linkPopup"]}},"$id":"1b2bbe2c"};

function validate23(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="1b2bbe2c" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.openMode !== undefined){
let data0 = data.openMode;
if(!(data0 === "linkPopup")){
const err0 = {instancePath:instancePath+"/openMode",schemaPath:"#/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema39.properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema39.properties.openMode.enum,parentSchema:schema39.properties.openMode,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema39.type,parentSchema:schema39,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate23.errors = vErrors;
return errors === 0;
}

exports["-69a5b4c1"] = validate24;
const schema40 = {"type":"object","properties":{"openMode":{"enum":["copy"]}},"$id":"-69a5b4c1"};

function validate24(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="-69a5b4c1" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.openMode !== undefined){
let data0 = data.openMode;
if(!(data0 === "copy")){
const err0 = {instancePath:instancePath+"/openMode",schemaPath:"#/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema40.properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema40.properties.openMode.enum,parentSchema:schema40.properties.openMode,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema40.type,parentSchema:schema40,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate24.errors = vErrors;
return errors === 0;
}

exports["-655cf207"] = validate25;
const schema41 = {"type":"object","properties":{"openMode":{"enum":["getTextStyles"]}},"$id":"-655cf207"};

function validate25(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="-655cf207" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.openMode !== undefined){
let data0 = data.openMode;
if(!(data0 === "getTextStyles")){
const err0 = {instancePath:instancePath+"/openMode",schemaPath:"#/properties/openMode/enum",keyword:"enum",params:{allowedValues: schema41.properties.openMode.enum},message:"must be equal to one of the allowed values",schema:schema41.properties.openMode.enum,parentSchema:schema41.properties.openMode,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema41.type,parentSchema:schema41,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate25.errors = vErrors;
return errors === 0;
}

exports["50e5d34c"] = validate26;
const schema42 = {"type":"object","properties":{"method":{"enum":["drag"]}},"$id":"50e5d34c"};

function validate26(data, {instancePath="", parentData, parentDataProperty, rootData=data}={}){
/*# sourceURL="50e5d34c" */;
let vErrors = null;
let errors = 0;
if(data && typeof data == "object" && !Array.isArray(data)){
if(data.method !== undefined){
let data0 = data.method;
if(!(data0 === "drag")){
const err0 = {instancePath:instancePath+"/method",schemaPath:"#/properties/method/enum",keyword:"enum",params:{allowedValues: schema42.properties.method.enum},message:"must be equal to one of the allowed values",schema:schema42.properties.method.enum,parentSchema:schema42.properties.method,data:data0};
if(vErrors === null){
vErrors = [err0];
}
else {
vErrors.push(err0);
}
errors++;
}
}
}
else {
const err1 = {instancePath,schemaPath:"#/type",keyword:"type",params:{type: "object"},message:"must be object",schema:schema42.type,parentSchema:schema42,data};
if(vErrors === null){
vErrors = [err1];
}
else {
vErrors.push(err1);
}
errors++;
}
validate26.errors = vErrors;
return errors === 0;
}
