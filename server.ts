import express from "express";
import path from "path";
import dotenv from "dotenv";
import postgres from "postgres";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Current user details
const CURRENT_USER_EMAIL = "nawapat@gmail.com";
const CURRENT_USER_NAME = "ณวพัทธ์ สุขสำราญ";
const CURRENT_USER_EMP_ID = "PEA-59821";
const CURRENT_USER_ROLE = "Senior IT Specialist";

// Define memory database fallbacks in case connection to Supabase fails
let useMemoryDb = false;

let sql: any = null;

// Sourced data for memory fallback & initial database seeding
const defaultCategories = [
  { name: "Finance", slug: "finance", description: "งานบัญชี ตรวจสอบงบประมาณ และพยากรณ์การงบประมาณ PEA", icon: "credit-card", sort_order: 1 },
  { name: "HR", slug: "hr", description: "งานพัฒนาบุคคลากร การประเมินผลงาน และสวัสดิการพนักงาน", icon: "users", sort_order: 2 },
  { name: "Procurement", slug: "procurement", description: "จัดซื้อจัดจ้าง ร่างทีโออาร์ (TOR) และสัญญาระหว่างส่วนงาน", icon: "shopping-bag", sort_order: 3 },
  { name: "Data Analytics", slug: "data-analytics", description: "วิเคราะห์ข้อมูลโหลดไฟฟ้า สายส่ง มิเตอร์ AMI และสถิติต่างๆ", icon: "bar-chart-2", sort_order: 4 },
  { name: "Presentation", slug: "presentation", description: "สร้างสไลด์ สรุปรายงานสำหรับผู้บริหาร และจัดบอร์ดนิทรรศการ", icon: "presentation", sort_order: 5 },
  { name: "Knowledge Management", slug: "knowledge-management", description: "สืบค้นข้อมูลระเบียบ PEA การแปลมาตรฐานสากล และแนวทางความปลอดภัย", icon: "book-open", sort_order: 6 }
];

const defaultTools = [
  { name: "ChatGPT", slug: "chatgpt", category: "General Conversational", website_url: "https://chatgpt.com" },
  { name: "Claude", slug: "claude", category: "Advanced Analysis", website_url: "https://claude.ai" },
  { name: "Gemini", slug: "gemini", category: "Google Workspace & Reasoning", website_url: "https://gemini.google.com" },
  { name: "NotebookLM", slug: "notebooklm", category: "Research & Documents", website_url: "https://notebooklm.google.com" },
  { name: "Codex", slug: "codex", category: "Code Generation", website_url: "https://openai.com" }
];

const defaultTags = [
  { name: "Customer Service", slug: "customer-service", color: "purple" },
  { name: "Engineering", slug: "engineering", color: "blue" },
  { name: "Report", slug: "report", color: "amber" },
  { name: "Procurement", slug: "procurement", color: "teal" },
  { name: "Data Analysis", slug: "data-analysis", color: "indigo" },
  { name: "Smart Grid", slug: "smart-grid", color: "cyan" }
];

// Initialize mock dataset for fallback
let memUsers = [
  { id: 1, employee_id: CURRENT_USER_EMP_ID, email: CURRENT_USER_EMAIL, display_name: CURRENT_USER_NAME, position: CURRENT_USER_ROLE, role: "admin", status: "active" },
  { id: 2, employee_id: "PEA-41235", email: "somchai.p@pea.co.th", display_name: "สมชาย ปลอดภัย", position: "Electrical Engineer, Substation Division", role: "user", status: "active" },
  { id: 3, employee_id: "PEA-30981", email: "wilawan.s@pea.co.th", display_name: "วิลาวัลย์ สิริโภค", position: "Procurement Manager, Logistics Dept", role: "user", status: "active" }
];

let memCategories = defaultCategories.map((c, idx) => ({ id: idx + 1, ...c }));
let memTools = defaultTools.map((t, idx) => ({ id: idx + 1, ...t }));
let memTags = defaultTags.map((tg, idx) => ({ id: idx + 1, ...tg }));

let memPrompts: any[] = [
  {
    id: "1",
    owner_user_id: 1,
    category_id: 4, // Data Analytics
    primary_tool_id: 2, // Claude
    title: "[PEA Call Center 1129] สรุปและคัดกรองข้อร้องเรียนผู้ใช้ไฟฟ้า",
    slug: "pea-1129-complaint-summarizer",
    description: "แปลงประวัติการโทรและคำร้องเรียนจากลูกค้ารายย่อย PEA ให้เป็นรายงานสรุปแบบ JSON เพื่อลำดับความสำคัญของปัญหาและส่งให้ทีมวิศวกรภาคสนามแก้ไขได้ทันที",
    visibility: "public",
    status: "published",
    language: "th",
    usage_count: 142,
    copy_count: 89,
    favorite_count: 12,
    created_at: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
    owner: { display_name: CURRENT_USER_NAME, email: CURRENT_USER_EMAIL, position: CURRENT_USER_ROLE },
    category: { name: "Data Analytics", slug: "data-analytics" },
    primary_tool: { name: "Claude", slug: "claude" },
    blocks: [
      {
        id: "b1",
        block_type: "system",
        name: "Role & Task Directive",
        content: "คุณทำหน้าที่เป็น Senior Analyst ของฝ่ายบริการลูกค้า PEA (Provincial Electricity Authority) หน้าที่ของคุณคือการวิเคราะห์บทเขียนการคุยโทรศัพท์สายด่วน 1129 จากนี้ และส่งคืนคำตอบในรูปแบบ JSON เท่านั้น",
        sort_order: 1,
        is_required: true
      },
      {
        id: "b2",
        block_type: "user",
        name: "Analysis Loop",
        content: "นี่คือข้อมูลข้อร้องเรียนดิบ:\n{customer_complaint_text}\n\nกรุณาสรุปประเด็นหลักและแยกข้อมูลดังนี้:\n1. ประเภทของปัญหา (ไฟดับ, แรงดันไฟฟ้าตก, บิลค่าไฟผิดปกติ, บริการมิเตอร์, อื่นๆ)\n2. พื้นที่ที่ได้รับผลกระทบ (อำเภอ/จังหวัด)\n3. ระดับความฉุกเฉิน (สูงมาก, ปานกลาง, ต่ำ)\n4. สรุปประเด็นความเดือดร้อนใน 1 ประโยค\n\nวิเคราะห์อย่างระมัดระวังตามบริบทพื้นที่การจ่ายไฟของ PEA",
        sort_order: 2,
        is_required: true
      }
    ],
    variables: [
      { id: "v1", name: "customer_complaint_text", label: "ข้อความร้องเรียนจากลูกค้า", description: "ใส่บันทึกประวัติการโทรดิบจากคอลเซ็นเตอร์", placeholder: "เช่น ไฟดับพิกัดหลังวัดเขาสามยอด ลพบุรี ดับมาประมาณ 1 ชั่วโมงแล้ว...", is_required: true }
    ],
    tags: [
      { id: 1, name: "Customer Service", slug: "customer-service", color: "purple" },
      { id: 5, name: "Data Analysis", slug: "data-analysis", color: "indigo" }
    ],
    is_favorite: true
  },
  {
    id: "2",
    owner_user_id: 2,
    category_id: 6, // Knowledge Management
    primary_tool_id: 3, // Gemini
    title: "[IEC Standard] แปลและสรุปมาตรฐานเทคนิค Smart Grid",
    slug: "iec-standard-smart-grid-translator",
    description: "สำหรับพนักงานวิศวกรรมไฟฟ้าที่ต้องการถอดความมาตรฐาน IEC/IEEE ที่เป็นภาษาอังกฤษเฉพาะทาง ให้เข้าใจง่ายเหมาะสมกับระเบียบปฏิบัติด้านความปลอดภัยของ PEA",
    visibility: "public",
    status: "published",
    language: "th",
    usage_count: 98,
    copy_count: 54,
    favorite_count: 8,
    created_at: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
    owner: { display_name: "สมชาย ปลอดภัย", email: "somchai.p@pea.co.th", position: "Electrical Engineer, Substation Division" },
    category: { name: "Knowledge Management", slug: "knowledge-management" },
    primary_tool: { name: "Gemini", slug: "gemini" },
    blocks: [
      {
        id: "b3",
        block_type: "instruction",
        name: "Standard Translator",
        content: "กรุณาแปลท่อนมาตรฐานด้านล่างนี้:\n{standard_context}\n\nโดยให้เน้นการแปลงคำศัพท์วิศวกรรมไฟฟ้าตามมาตรฐานภาษาไทยของ PEA เช่น Substation -> สถานีไฟฟ้า, Feeder -> สายป้อน, Transformer -> หม้อแปลงไฟฟ้า, PT/CT -> หม้อแปลงระบุค่าพิกัด\n\nพร้อมสรุปสาระสำคัญหลักเป็น 3 ข้อสั้นที่บุคลากรหน้างานในพื้นที่ต้องนำไประมัดระวังในขั้นตอนปฏิบัติงาน",
        sort_order: 1,
        is_required: true
      }
    ],
    variables: [
      { id: "v2", name: "standard_context", label: "ท่อนมาตรฐานทางเทคนิคอังกฤษ", description: "Copy ข้อความหรือท่อนสเป็คจากเว็บผู้ผลิตหรือมาตรฐานสากลมาใส่", placeholder: "เช่น IEC 61850 defines general requirements for communication networks...", is_required: true }
    ],
    tags: [
      { id: 2, name: "Engineering", slug: "engineering", color: "blue" },
      { id: 6, name: "Smart Grid", slug: "smart-grid", color: "cyan" }
    ],
    is_favorite: false
  },
  {
    id: "3",
    owner_user_id: 1,
    category_id: 4, // Data Analytics
    primary_tool_id: 1, // ChatGPT
    title: "[Power BI DAX] ตัวจำแนกจุดผิดปกติของโหลดไฟฟ้าสถานีย่อย (Substation Load Anomalies)",
    slug: "power-bi-substation-dax-helper",
    description: "ช่วยเขียนสูตร DAX บน Power BI เพื่อตรวจจับการปล่อยไฟผิดปกติเกินพิกัดพาวเวอร์ทรานส์ฟอร์เมอร์ในแต่ละชั่วโมง หรือระบุช่วงที่สูญเสียแรงดันเกินระดับมาตรฐาน 5%",
    visibility: "public",
    status: "published",
    language: "th",
    usage_count: 76,
    copy_count: 42,
    favorite_count: 15,
    created_at: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 3600000).toISOString(),
    owner: { display_name: CURRENT_USER_NAME, email: CURRENT_USER_EMAIL, position: CURRENT_USER_ROLE },
    category: { name: "Data Analytics", slug: "data-analytics" },
    primary_tool: { name: "ChatGPT", slug: "chatgpt" },
    blocks: [
      {
        id: "b4",
        block_type: "system",
        name: "DAX Advisor",
        content: "คุณคือผู้เชี่ยวชาญด้าน Power BI และการสร้างโมเดลวิเคราะห์ปริมาณไฟฟ้าของ PEA คุณจะช่วยเหลือผู้ใช้เขียน DAX Measure ที่มีประสิทธิภาพสูงสุด",
        sort_order: 1,
        is_required: true
      },
      {
        id: "b5",
        block_type: "user",
        name: "Formula Generation",
        content: "ฉันต้องการคำนวณ {calculation_goal} โดยใช้ตารางหลักชื่อ '{table_name}'\nที่มีฟิลด์พลังงานไฟฟ้าชื่อ '{peak_mw_field}' และชื่อสถานีไฟฟ้าคือ '{substation_field}'\n\nเขียนสูตร DAX พร้อมระบุคำอธิบายระบบการคิดแต่ละบรรทัดให้เข้าใจแจ่มแจ้ง",
        sort_order: 2,
        is_required: true
      }
    ],
    variables: [
      { id: "v3", name: "calculation_goal", label: "เป้าหมายการคำนวณ", description: "ระบุความต้องการทางสถิติที่ต้องการวัด", placeholder: "เช่น การหาค่า Peak MW สูงสุดเฉลี่ยแบบ Rolling 3 เดือนย้อนหลังแยกรายสถานี", is_required: true },
      { id: "v4", name: "table_name", label: "ชื่อตารางข้อมูลโหลด", description: "คอลัมน์และตารางในโมเดลของคุณ", placeholder: "SubstationHourlyLoad", is_required: true },
      { id: "v5", name: "peak_mw_field", label: "ชื่อฟิลด์ MW", description: "ฟิลด์ตัวเลขพลังงานไฟฟ้าหลัก", placeholder: "ActivePowerLoadMW", is_required: true },
      { id: "v6", name: "substation_field", label: "ชื่อฟิลด์สถานี", description: "ชื่อคอลัมน์ชื่อสถานีไฟฟ้า", placeholder: "SubstationID", is_required: true }
    ],
    tags: [
      { id: 3, name: "Report", slug: "report", color: "amber" },
      { id: 5, name: "Data Analysis", slug: "data-analysis", color: "indigo" }
    ],
    is_favorite: true
  },
  {
    id: "4",
    owner_user_id: 3,
    category_id: 3, // Procurement
    primary_tool_id: 2, // Claude
    title: "[PEA TOR Draft] โครงร่างร่างขอบเขตของงานจัดซื้อเครื่องทดสอบมิเตอร์",
    slug: "pea-tor-scoping-meter-test",
    description: "ช่วยร่างโครงสร้างหลักและหัวข้อข้อกำหนดทางเทคนิค (Technical Specification) สำหรับเช่าหรือจัดหาเครื่องวัดและวิเคราะห์ความแม่นยำโหลดมิเตอร์ตามระเบียบพัสดุ",
    visibility: "public",
    status: "published",
    language: "th",
    usage_count: 53,
    copy_count: 22,
    favorite_count: 4,
    created_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
    owner: { display_name: "วิลาวัลย์ สิริโภค", email: "wilawan.s@pea.co.th", position: "Procurement Manager, Logistics Dept" },
    category: { name: "Procurement", slug: "procurement" },
    primary_tool: { name: "Claude", slug: "claude" },
    blocks: [
      {
        id: "b6",
        block_type: "instruction",
        name: "TOR Procurement Structure",
        content: "ช่วยจัดทําโครงร่าง TOR (Terms of Reference) สำหรับอุปกรณ์: {equipment_name}\nงบประมาณประมาณ: {budget_thb} บาท\n\nโดยจัดหมวดหมู่โครงร่างตามหัวข้อมาตรฐานระเบียบจัดซื้อภาครัฐ PEA:\n1. วัตถุประสงค์การจัดสรร\n2. คุณสมบัติของผู้เสนอราคา\n3. คุณลักษณะเฉพาะทางเทคนิค (Technical Constraints)\n4. กำหนดเวลาส่งมอบและการรับประกันคุณภาพสินค้า\n\nพร้อมทั้งระบุตัวอย่างเกณฑ์การให้คะแนน (Technical Score Weight) 70% และ ราคา 30%",
        sort_order: 1,
        is_required: true
      }
    ],
    variables: [
      { id: "v7", name: "equipment_name", label: "ชื่ออุปกรณ์เครื่องมือหรือระบบ", description: "ระบุสิ่งของที่ประสงค์จัดหา", placeholder: "เครื่องตรวจสอบความเที่ยงตรงมิเตอร์ไฟฟ้าอัจฉริยะ 3 เฟส แบบพกพา", is_required: true },
      { id: "v8", name: "budget_thb", label: "วงเงินงบประมาณ (บาท)", description: "ขนาดเงินทุนโครงการจัดหา", placeholder: "4,500,000", is_required: true }
    ],
    tags: [
      { id: 4, name: "Procurement", slug: "procurement", color: "teal" }
    ],
    is_favorite: false
  },
  {
    id: "5",
    owner_user_id: 1,
    category_id: 5, // Presentation
    primary_tool_id: 3, // Gemini
    title: "[Executive Slideshow] แปลงข้อมูลสรุปสายตรวจสายส่งให้กลายเป็น Outline สไลด์",
    slug: "executive-presentation-generator",
    description: "ช่วยฝ่ายปฏิบัติการและบำรุงรักษาสกัดเฉพาะประเด็นปัญหาความชำรุดของอุปกรณ์เสาไฟฟ้า-แรงต่ำ เพื่อนำไปทำ PowerPoint ให้กับผู้บริหาร PEA ดูสถานะในรายสัปดาห์",
    visibility: "private",
    status: "published",
    language: "th",
    usage_count: 110,
    copy_count: 67,
    favorite_count: 9,
    created_at: new Date(Date.now() - 12 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
    owner: { display_name: CURRENT_USER_NAME, email: CURRENT_USER_EMAIL, position: CURRENT_USER_ROLE },
    category: { name: "Presentation", slug: "presentation" },
    primary_tool: { name: "Gemini", slug: "gemini" },
    blocks: [
      {
        id: "b7",
        block_type: "user",
        name: "Slide Outliner",
        content: "ให้แปรสภาพบันทึกผลการสำรวจสายส่งต่อไปนี้:\n{raw_inspection_report}\n\nเป็นโครงร่างเพื่อใส่สไลด์นำเสนอผู้จัดการ (ผู้บริหารระดับกลาง) โดยแยกสไลด์เป็น 4 แผ่น:\n- แผ่นที่ 1: หัวข้อหลักและตัวชี้วัดความเสียหายของโครงข่ายภาพรวม (Executive Summary Metric)\n- แผ่นที่ 2: พิกัดเสาไฟฟ้าและจุดคอขวดที่ต้องซ่อมบำรุงด่วน\n- แผ่นที่ 3: แผนจัดสรรทรัพยากร พนักงาน ช่างเทคนิคในการลงพื้นที่ และระยะเวลาซ่อมแซม\n- แผ่นที่ 4: ตัวแปรผลกระทบสำคัญหากไม่มีการบำรุงรักษา\n\nใช้สไตล์การเขียนแบบรายงานราชการที่มีน้ำเสียงน่าเกรงขาม มั่นใจ และชัดถ้อยชัดคำ",
        sort_order: 1,
        is_required: true
      }
    ],
    variables: [
      { id: "v9", name: "raw_inspection_report", label: "รายงานตรวจพบลักษณะชำรุด", description: "พิมพ์ข้อมูลบันทึกจดจากเจ้าหน้าที่หน้างานเสาไฟฟ้า", placeholder: "พบเสาไฟฟ้าเอน 3 องศา จำนวน 4 ต้น ทางหลวงหมายเลข 21 กม. 45 และพบสายเคเบิลหย่อนคล้อยต่ำกว่าความสูงที่กำหนด เสี่ยงต่อรถบรรทุกเกี่ยวเสียหาย...", is_required: true }
    ],
    tags: [
      { id: 2, name: "Engineering", slug: "engineering", color: "blue" },
      { id: 3, name: "Report", slug: "report", color: "amber" }
    ],
    is_favorite: false
  },
  {
    id: "6",
    owner_user_id: 1,
    category_id: 4, // Data Analytics
    primary_tool_id: 3, // Gemini
    title: "[PEA Smart Meter Analyzer] ตรวจสอบความสอดคล้องข้อมูลการใช้กระแสโหลดไฟฟ้าสลับแบบสามเฟส",
    slug: "pea-smart-meter-load-consistency",
    description: "ตรวจสอบปริมาณมิเตอร์ขัดข้อง หรือลักษณะผู้ใช้ไฟที่มีพฤติกรรมกระแสไฟฟ้าไม่สมดุลในเฟส (Phase Unbalance) หรือการใช้หน่วยติดลบเฉียบพลัน เพื่อป้องกันการโจรกรรมหรือมิเตอร์เสีย",
    visibility: "private",
    status: "published",
    language: "th",
    usage_count: 45,
    copy_count: 20,
    favorite_count: 3,
    created_at: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 24 * 3600000).toISOString(),
    owner: { display_name: CURRENT_USER_NAME, email: CURRENT_USER_EMAIL, position: CURRENT_USER_ROLE },
    category: { name: "Data Analytics", slug: "data-analytics" },
    primary_tool: { name: "Gemini", slug: "gemini" },
    blocks: [
      {
        id: "b8",
        block_type: "user",
        name: "Meter Audit Spec",
        content: "กรุณาอ่านข้อมูลสถิติมิเตอร์ดังนี้:\n{smart_meter_data}\n\nตรวจสอบหาสัญญาณเตือนภัยทางกฎหมายและวิธีวิศวกรรมไฟฟ้า:\n- Phase Unbalance (ความสมดุลของกระแสแต่ละเฟส I_a, I_b, I_c เกิน 15% หรือไม่?)\n- หน่วยที่วัดได้หยุดนิ่งหรือลดลงผิดสังเกตท่ามกลางสายแอร์ทำงานปกติ\n- รายงานจุดผิดปกติที่ควรให้ช่างฝีมือรีบเดินทางไปสำรวจเครื่องวัดทันที",
        sort_order: 1,
        is_required: true
      }
    ],
    variables: [
      { id: "v10", name: "smart_meter_data", label: "ข้อมูลมิเตอร์ออมนิ (A, B, C Current/KW Logs)", description: "วางตาราง logs ค่ากระแสในแต่ละเฟสหรือประวัติค่าหน่วย", placeholder: "Phase A: 45A, Phase B: 12A, Phase C: 47A, Time: 14:00...", is_required: true }
    ],
    tags: [
      { id: 2, name: "Engineering", slug: "engineering", color: "blue" },
      { id: 5, name: "Data Analysis", slug: "data-analysis", color: "indigo" }
    ],
    is_favorite: true
  }
];

let memFavorites = new Set<string | number>([1, 3, 6]);

// DB Connection Initialization
const initializeDatabase = async () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("YOUR_PASSWORD")) {
    console.warn("⚠️ No valid DATABASE_URL provided. Falling back to in-memory database system.");
    useMemoryDb = true;
    return;
  }

  try {
    // Connect with timeout to prevent blocking application start
    sql = postgres(dbUrl, {
      connect_timeout: 5, 
      max: 5, // Connection pool size limit
    });

    console.log("⚡ Connecting to Supabase database...");
    
    // Test connection
    await sql`SELECT 1`;
    console.log("✅ Supabase database connection succeeds!");

    // Check for legay database tables with missing columns
    const tblExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'prompts'
      );
    `;
    if (tblExists[0] && tblExists[0].exists) {
      const colCheck = await sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'prompts' 
        AND column_name = 'owner_user_id'
      `;
      if (colCheck.length === 0) {
        console.log("⚠️ Legacy/Incompatible 'prompts' table detected without 'owner_user_id'. Rebuilding schema...");
        await sql`DROP TABLE IF EXISTS prompt_usage_events CASCADE;`;
        await sql`DROP TABLE IF EXISTS user_favorites CASCADE;`;
        await sql`DROP TABLE IF EXISTS prompt_tags CASCADE;`;
        await sql`DROP TABLE IF EXISTS prompt_variables CASCADE;`;
        await sql`DROP TABLE IF EXISTS prompt_blocks CASCADE;`;
        await sql`DROP TABLE IF EXISTS prompt_versions CASCADE;`;
        await sql`DROP TABLE IF EXISTS prompts CASCADE;`;
        await sql`DROP TABLE IF EXISTS tools CASCADE;`;
        await sql`DROP TABLE IF EXISTS prompt_categories CASCADE;`;
        await sql`DROP TABLE IF EXISTS users CASCADE;`;
        console.log("✅ Dropped out-of-date tables successfully.");
      }
    }

    // Run table initialization
    console.log("🛠️ Checking database schema tables...");
    
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        employee_id VARCHAR(20) UNIQUE,
        email VARCHAR(255) UNIQUE NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        position VARCHAR(255),
        avatar_url TEXT,
        role VARCHAR(20) NOT NULL DEFAULT 'user',
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS prompt_categories (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        icon VARCHAR(100),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tools (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        category VARCHAR(100),
        icon_url TEXT,
        website_url TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS prompts (
        id BIGSERIAL PRIMARY KEY,
        owner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category_id BIGINT REFERENCES prompt_categories(id) ON DELETE SET NULL,
        primary_tool_id BIGINT REFERENCES tools(id) ON DELETE SET NULL,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE,
        description TEXT,
        visibility VARCHAR(20) NOT NULL DEFAULT 'private',
        status VARCHAR(20) NOT NULL DEFAULT 'draft',
        language VARCHAR(20) DEFAULT 'th',
        current_version_id BIGINT,
        usage_count INT DEFAULT 0,
        copy_count INT DEFAULT 0,
        favorite_count INT DEFAULT 0,
        rating_avg DECIMAL(3,2) DEFAULT 0,
        rating_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        archived_at TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS prompt_versions (
        id BIGSERIAL PRIMARY KEY,
        prompt_id BIGINT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
        version_number INT NOT NULL,
        change_note TEXT,
        created_by_user_id BIGINT REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS prompt_blocks (
        id BIGSERIAL PRIMARY KEY,
        prompt_version_id BIGINT NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
        block_type VARCHAR(50) NOT NULL,
        name VARCHAR(255),
        content TEXT NOT NULL,
        sort_order INT DEFAULT 0,
        is_required BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS prompt_variables (
        id BIGSERIAL PRIMARY KEY,
        prompt_version_id BIGINT NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        label VARCHAR(255),
        description TEXT,
        input_type VARCHAR(50),
        default_value TEXT,
        placeholder TEXT,
        is_required BOOLEAN DEFAULT FALSE,
        validation_json JSONB,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tags (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        color VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS prompt_tags (
        prompt_id BIGINT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
        tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY(prompt_id, tag_id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS user_favorites (
        user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        prompt_id BIGINT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(user_id, prompt_id)
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS prompt_usage_events (
        id BIGSERIAL PRIMARY KEY,
        prompt_id BIGINT NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
        prompt_version_id BIGINT REFERENCES prompt_versions(id) ON DELETE SET NULL,
        user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        tool_id BIGINT REFERENCES tools(id) ON DELETE SET NULL,
        event_type VARCHAR(50) NOT NULL,
        source VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log("✅ Main tables verified/created successfully.");

    // Seeds initial database elements if empty
    const usersCount = await sql`SELECT count(*) FROM users`;
    if (parseInt(usersCount[0].count) === 0) {
      console.log("🌱 Database is empty! Seeding users, categories, tools, is_favorite indices, and sample prompts...");
      
      // Seed Users
      const seededUsers = [];
      for (const u of memUsers) {
        const [insertedUser] = await sql`
          INSERT INTO users (employee_id, email, display_name, position, role, status)
          VALUES (${u.employee_id}, ${u.email}, ${u.display_name}, ${u.position}, ${u.role}, ${u.status})
          RETURNING *
        `;
        seededUsers.push(insertedUser);
      }
      
      // Seed Categories
      const seededCategories = [];
      for (const cat of defaultCategories) {
        const [insertedCat] = await sql`
          INSERT INTO prompt_categories (name, slug, description, icon, sort_order)
          VALUES (${cat.name}, ${cat.slug}, ${cat.description}, ${cat.icon}, ${cat.sort_order})
          ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING *
        `;
        seededCategories.push(insertedCat);
      }

      // Seed Tools
      const seededTools = [];
      for (const tool of defaultTools) {
        const [insertedTool] = await sql`
          INSERT INTO tools (name, slug, category, website_url)
          VALUES (${tool.name}, ${tool.slug}, ${tool.category}, ${tool.website_url})
          ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING *
        `;
        seededTools.push(insertedTool);
      }

      // Seed Tags
      const seededTags = [];
      for (const tag of defaultTags) {
        const [insertedTag] = await sql`
          INSERT INTO tags (name, slug, color)
          VALUES (${tag.name}, ${tag.slug}, ${tag.color})
          ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING *
        `;
        seededTags.push(insertedTag);
      }

      // Seed Prompts, Versions, Blocks, Variables
      for (const p of memPrompts) {
        const categoryId = seededCategories.find(c => c.slug === p.category.slug)?.id;
        const toolId = seededTools.find(t => t.slug === p.primary_tool.slug)?.id;
        const ownerId = seededUsers.find(u => u.email === p.owner.email)?.id || seededUsers[0].id;

        // Insert Prompt
        const [insertedPrompt] = await sql`
          INSERT INTO prompts (owner_user_id, category_id, primary_tool_id, title, slug, description, visibility, status, language, usage_count, copy_count, favorite_count)
          VALUES (${ownerId}, ${categoryId}, ${toolId}, ${p.title}, ${p.slug}, ${p.description}, ${p.visibility}, ${p.status}, ${p.language}, ${p.usage_count}, ${p.copy_count}, ${p.favorite_count})
          RETURNING *
        `;

        // Insert prompt_version
        const [insertedVersion] = await sql`
          INSERT INTO prompt_versions (prompt_id, version_number, change_note, created_by_user_id)
          VALUES (${insertedPrompt.id}, 1, 'Initial release', ${ownerId})
          RETURNING *
        `;

        // Update prompt current_version_id
        await sql`
          UPDATE prompts SET current_version_id = ${insertedVersion.id} WHERE id = ${insertedPrompt.id}
        `;

        // Insert Blocks
        for (const block of p.blocks) {
          await sql`
            INSERT INTO prompt_blocks (prompt_version_id, block_type, name, content, sort_order)
            VALUES (${insertedVersion.id}, ${block.block_type}, ${block.name}, ${block.content}, ${block.sort_order})
          `;
        }

        // Insert Variables
        for (const variable of p.variables) {
          await sql`
            INSERT INTO prompt_variables (prompt_version_id, name, label, description, placeholder, is_required)
            VALUES (${insertedVersion.id}, ${variable.name}, ${variable.label}, ${variable.description}, ${variable.placeholder}, ${variable.is_required})
          `;
        }

        // Connect Tags
        for (const tagItem of p.tags) {
          const tId = seededTags.find(tg => tg.slug === tagItem.slug)?.id;
          if (tId) {
            await sql`
              INSERT INTO prompt_tags (prompt_id, tag_id)
              VALUES (${insertedPrompt.id}, ${tId})
              ON CONFLICT DO NOTHING
            `;
          }
        }

        // Insert mock favorite for default user
        if (p.is_favorite) {
          await sql`
            INSERT INTO user_favorites (user_id, prompt_id)
            VALUES (${seededUsers[0].id}, ${insertedPrompt.id})
            ON CONFLICT DO NOTHING
          `;
        }
      }
      console.log("🌱 Database seeding completed successfully!");
    } else {
      console.log("📊 Database already seeded. Core count: " + usersCount[0].count + " users.");
    }
  } catch (err) {
    console.error("❌ Supabase connection or queries failed. Continuing with memory database setup.", err);
    useMemoryDb = true;
  }
};

initializeDatabase();

// API Endpoints

// 1. Get Session Information
app.get("/api/session", async (req, res) => {
  try {
    if (useMemoryDb) {
      const u = memUsers.find(x => x.email === CURRENT_USER_EMAIL) || memUsers[0];
      return res.json(u);
    } else {
      const results = await sql`SELECT * FROM users WHERE email = ${CURRENT_USER_EMAIL} LIMIT 1`;
      if (results.length > 0) {
        return res.json(results[0]);
      } else {
        // Safe creation of current user
        const [newUser] = await sql`
          INSERT INTO users (employee_id, email, display_name, position, role, status)
          VALUES (${CURRENT_USER_EMP_ID}, ${CURRENT_USER_EMAIL}, ${CURRENT_USER_NAME}, ${CURRENT_USER_ROLE}, 'admin', 'active')
          RETURNING *
        `;
        return res.json(newUser);
      }
    }
  } catch (error) {
    console.error("Error fetching session:", error);
    // Silent fail safe
    return res.json({ id: 1, email: CURRENT_USER_EMAIL, display_name: CURRENT_USER_NAME, position: CURRENT_USER_ROLE });
  }
});

// 2. Fetch Categories
app.get("/api/categories", async (req, res) => {
  try {
    if (useMemoryDb) {
      return res.json(memCategories);
    } else {
      const cats = await sql`SELECT * FROM prompt_categories WHERE is_active = true ORDER BY sort_order ASC, id ASC`;
      return res.json(cats);
    }
  } catch (error) {
    res.json(memCategories);
  }
});

// 3. Fetch Tools
app.get("/api/tools", async (req, res) => {
  try {
    if (useMemoryDb) {
      return res.json(memTools);
    } else {
      const tls = await sql`SELECT * FROM tools WHERE is_active = true ORDER BY id ASC`;
      return res.json(tls);
    }
  } catch (error) {
    res.json(memTools);
  }
});

// 4. Fetch Tags
app.get("/api/tags", async (req, res) => {
  try {
    if (useMemoryDb) {
      return res.json(memTags);
    } else {
      const tgs = await sql`SELECT * FROM tags ORDER BY id ASC`;
      return res.json(tgs);
    }
  } catch (error) {
    res.json(memTags);
  }
});

// Helper function to hydrate queries inside Postgres manually so we don't need complex ORM configurations
const hydratePostgresPrompts = async (dbPrompts: any[]) => {
  if (!dbPrompts || dbPrompts.length === 0) return [];

  const hydratedList = [];
  for (const p of dbPrompts) {
    const ownerResults = await sql`SELECT display_name, email, position FROM users WHERE id = ${p.owner_user_id}`;
    const categoryResults = p.category_id ? await sql`SELECT name, slug FROM prompt_categories WHERE id = ${p.category_id}` : [];
    const toolResults = p.primary_tool_id ? await sql`SELECT name, slug FROM tools WHERE id = ${p.primary_tool_id}` : [];
    
    // Get version
    let blocks: any[] = [];
    let variables: any[] = [];
    if (p.current_version_id) {
      blocks = await sql`SELECT id, block_type, name, content, sort_order FROM prompt_blocks WHERE prompt_version_id = ${p.current_version_id} ORDER BY sort_order ASC`;
      variables = await sql`SELECT id, name, label, description, placeholder, is_required FROM prompt_variables WHERE prompt_version_id = ${p.current_version_id} ORDER BY id ASC`;
    }

    // Get tags
    const tags = await sql`
      SELECT t.id, t.name, t.slug, t.color 
      FROM tags t
      JOIN prompt_tags pt ON pt.tag_id = t.id
      WHERE pt.prompt_id = ${p.id}
    `;

    // Am I Favorited by standard user?
    const favUserResults = await sql`
      SELECT 1 FROM user_favorites 
      WHERE prompt_id = ${p.id} AND user_id = (SELECT id FROM users WHERE email = ${CURRENT_USER_EMAIL} LIMIT 1)
    `;
    const isFavorite = favUserResults.length > 0;

    hydratedList.push({
      id: String(p.id),
      title: p.title,
      description: p.description || "",
      visibility: p.visibility,
      status: p.status,
      language: p.language,
      usage_count: Number(p.usage_count || 0),
      copy_count: Number(p.copy_count || 0),
      favorite_count: Number(p.favorite_count || 0),
      created_at: p.created_at,
      updated_at: p.updated_at,
      owner: ownerResults[0] || { display_name: "Unknown Owner" },
      category: categoryResults[0] || null,
      primary_tool: toolResults[0] || null,
      blocks,
      variables,
      tags,
      is_favorite: isFavorite
    });
  }

  return hydratedList;
};

// 5. Get All Hydrated Prompts
app.get("/api/prompts", async (req, res) => {
  try {
    const { search, tool, tab, sort, category } = req.query;

    if (useMemoryDb) {
      let filtered = [...memPrompts];

      // Filter by search text
      if (search) {
        const query = String(search).toLowerCase();
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t: any) => t.name.toLowerCase().includes(query)) ||
          p.blocks.some((b: any) => b.content.toLowerCase().includes(query))
        );
      }

      // Filter by tool slug
      if (tool) {
        filtered = filtered.filter(p => p.primary_tool?.slug === tool);
      }

      // Filter by category slug
      if (category) {
        filtered = filtered.filter(p => p.category?.slug === category);
      }

      // Sidebar Tab Filter: 'all', 'private', 'public', 'favorites'
      if (tab === "private") {
        filtered = filtered.filter(p => p.visibility === "private" && p.owner?.email === CURRENT_USER_EMAIL);
      } else if (tab === "public") {
        filtered = filtered.filter(p => p.visibility === "public");
      } else if (tab === "favorites") {
        filtered = filtered.filter(p => memFavorites.has(Number(p.id)) || p.is_favorite);
      }

      // Sort
      if (sort === "most_used") {
        filtered.sort((a, b) => b.usage_count - a.usage_count);
      } else if (sort === "title") {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        // recently_updated
        filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      }

      return res.json(filtered);
    } else {
      // Postgres fetching
      let queryBase = sql`SELECT * FROM prompts WHERE status != 'archived'`;

      const results = await sql`SELECT * FROM prompts WHERE status != 'archived'`;
      const hydrated = await hydratePostgresPrompts(results);

      let filtered = hydrated;

      // Filter search
      if (search) {
        const query = String(search).toLowerCase();
        filtered = filtered.filter(p => 
          p.title.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((t: any) => t.name.toLowerCase().includes(query)) ||
          p.blocks.some((b: any) => b.content.toLowerCase().includes(query))
        );
      }

      // Filter tool
      if (tool) {
        filtered = filtered.filter(p => p.primary_tool?.slug === tool);
      }

      // Filter category
      if (category) {
        filtered = filtered.filter(p => p.category?.slug === category);
      }

      // Filter tab
      if (tab === "private") {
        filtered = filtered.filter(p => p.visibility === 'private' && p.owner?.email === CURRENT_USER_EMAIL);
      } else if (tab === "public") {
        filtered = filtered.filter(p => p.visibility === 'public');
      } else if (tab === "favorites") {
        filtered = filtered.filter(p => p.is_favorite);
      }

      // Sort
      if (sort === "most_used") {
        filtered.sort((a, b) => b.usage_count - a.usage_count);
      } else if (sort === "title") {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
      }

      return res.json(filtered);
    }
  } catch (error) {
    console.error("Error gathering prompts:", error);
    return res.json(memPrompts);
  }
});

// 6. Quick Save / Create Prompt
app.post("/api/prompts", async (req, res) => {
  try {
    const { title, description, content, type, tool, visibility, tags } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: "Title and Content are required." });
    }

    // Helper to find variables matching {name} pattern
    const extractVariables = (txt: string) => {
      const regex = /\{([a-zA-Z0-9_]+)\}/g;
      const vars = [];
      let match;
      const seen = new Set();
      while ((match = regex.exec(txt)) !== null) {
        const varName = match[1];
        if (!seen.has(varName)) {
          seen.add(varName);
          vars.push({
            name: varName,
            label: varName.charAt(0).toUpperCase() + varName.slice(1).replace(/_/g, ' '),
            description: `Variable: ${varName}`,
            placeholder: `Enter ${varName}...`,
            is_required: true
          });
        }
      }
      return vars;
    };

    const variablesDetected = extractVariables(content);

    if (useMemoryDb) {
      const categoryObj = memCategories.find(c => c.id === 4) || memCategories[0]; // default 'Data Analytics'
      const toolObj = memTools.find(t => t.slug === tool) || memTools[0];
      const newId = String(memPrompts.length + 1);

      // Create tags list from names
      const finalTags = (tags || []).map((tName: string, i: number) => {
        const existing = memTags.find(x => x.name.toLowerCase() === tName.toLowerCase());
        if (existing) return existing;
        const newTag = { id: memTags.length + i + 1, name: tName, slug: tName.toLowerCase().replace(/\s+/g, '-'), color: 'purple' };
        memTags.push(newTag);
        return newTag;
      });

      const newPrompt: any = {
        id: newId,
        owner_user_id: 1,
        category_id: categoryObj.id,
        primary_tool_id: toolObj.id,
        title,
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
        description: description || "",
        visibility: visibility || "private",
        status: "published",
        language: "th",
        usage_count: 0,
        copy_count: 0,
        favorite_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        owner: { display_name: CURRENT_USER_NAME, email: CURRENT_USER_EMAIL, position: CURRENT_USER_ROLE },
        category: { name: categoryObj.name, slug: categoryObj.slug },
        primary_tool: { name: toolObj.name, slug: toolObj.slug },
        blocks: [
          {
            id: `b_user_${newId}`,
            block_type: type || "user",
            name: "Main Script",
            content,
            sort_order: 1,
            is_required: true
          }
        ],
        variables: variablesDetected.map((v, i) => ({ id: `v_user_${newId}_${i}`, ...v })),
        tags: finalTags,
        is_favorite: false
      };

      memPrompts.unshift(newPrompt);
      return res.json(newPrompt);
    } else {
      // Find default user inside database
      const userRes = await sql`SELECT id FROM users WHERE email = ${CURRENT_USER_EMAIL} LIMIT 1`;
      const ownerId = userRes.length > 0 ? userRes[0].id : 1;

      // Category and tool
      const catRes = await sql`SELECT id, name, slug FROM prompt_categories LIMIT 1`;
      const categoryId = catRes.length > 0 ? catRes[0].id : null;
      
      const toolRes = await sql`SELECT id, name, slug FROM tools WHERE slug = ${tool} LIMIT 1`;
      const primaryToolId = toolRes.length > 0 ? toolRes[0].id : null;

      // Insert Prompt
      const [newPrompt] = await sql`
        INSERT INTO prompts (owner_user_id, category_id, primary_tool_id, title, description, visibility, status, language)
        VALUES (${ownerId}, ${categoryId}, ${primaryToolId}, ${title}, ${description || ""}, ${visibility || "private"}, 'published', 'th')
        RETURNING *
      `;

      // Insert version
      const [newVersion] = await sql`
        INSERT INTO prompt_versions (prompt_id, version_number, change_note, created_by_user_id)
        VALUES (${newPrompt.id}, 1, 'Quick saved', ${ownerId})
        RETURNING *
      `;

      // Assign current_version_id
      await sql`
        UPDATE prompts SET current_version_id = ${newVersion.id} WHERE id = ${newPrompt.id}
      `;

      // Add main content block
      await sql`
        INSERT INTO prompt_blocks (prompt_version_id, block_type, name, content, sort_order)
        VALUES (${newVersion.id}, ${type || 'user'}, 'Main content', ${content}, 1)
      `;

      // Add detected variables
      for (const v of variablesDetected) {
        await sql`
          INSERT INTO prompt_variables (prompt_version_id, name, label, description, placeholder, is_required)
          VALUES (${newVersion.id}, ${v.name}, ${v.label}, ${v.description}, ${v.placeholder}, ${v.is_required})
        `;
      }

      // Add Tags
      for (const tName of (tags || [])) {
        // Find or create tag
        const tagSlug = tName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        let tagId;
        const existingTag = await sql`SELECT id FROM tags WHERE slug = ${tagSlug} LIMIT 1`;
        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          const [insertedTag] = await sql`
            INSERT INTO tags (name, slug, color)
            VALUES (${tName}, ${tagSlug}, 'purple')
            RETURNING id
          `;
          tagId = insertedTag.id;
        }

        await sql`
          INSERT INTO prompt_tags (prompt_id, tag_id)
          VALUES (${newPrompt.id}, ${tagId})
          ON CONFLICT DO NOTHING
        `;
      }

      // Fetch newly created hydrated data and send back
      const [freshRow] = await sql`SELECT * FROM prompts WHERE id = ${newPrompt.id}`;
      const [hydratedPrompt] = await hydratePostgresPrompts([freshRow]);
      return res.json(hydratedPrompt);
    }
  } catch (error) {
    console.error("Error creating prompt:", error);
    res.status(500).json({ error: "Failed to save prompt." });
  }
});

// 7. Toggle Favorite
app.post("/api/prompts/toggle-favorite", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Missing prompt id." });

    if (useMemoryDb) {
      const idx = memPrompts.findIndex(p => p.id === String(id));
      if (idx !== -1) {
        const isFav = memFavorites.has(Number(id)) || memPrompts[idx].is_favorite;
        if (isFav) {
          memFavorites.delete(Number(id));
          memPrompts[idx].is_favorite = false;
          memPrompts[idx].favorite_count = Math.max(0, memPrompts[idx].favorite_count - 1);
        } else {
          memFavorites.add(Number(id));
          memPrompts[idx].is_favorite = true;
          memPrompts[idx].favorite_count += 1;
        }
        return res.json({ success: true, is_favorite: memPrompts[idx].is_favorite, favorite_count: memPrompts[idx].favorite_count });
      }
      return res.status(404).json({ error: "Prompt not found" });
    } else {
      // Find user id
      const userRes = await sql`SELECT id FROM users WHERE email = ${CURRENT_USER_EMAIL} LIMIT 1`;
      const userId = userRes.length > 0 ? userRes[0].id : 1;

      // Check if already is_favorite
      const favRes = await sql`
        SELECT 1 FROM user_favorites 
        WHERE user_id = ${userId} AND prompt_id = ${id}
      `;

      let nowFavorite = false;
      if (favRes.length > 0) {
        // Remove favorite
        await sql`DELETE FROM user_favorites WHERE user_id = ${userId} AND prompt_id = ${id}`;
        await sql`UPDATE prompts SET favorite_count = GREATEST(0, favorite_count - 1) WHERE id = ${id}`;
        nowFavorite = false;
      } else {
        // Add favorite
        await sql`INSERT INTO user_favorites (user_id, prompt_id) VALUES (${userId}, ${id})`;
        await sql`UPDATE prompts SET favorite_count = favorite_count + 1 WHERE id = ${id}`;
        nowFavorite = true;
      }

      // Query latest count
      const [updatedPrompt] = await sql`SELECT favorite_count FROM prompts WHERE id = ${id}`;
      return res.json({ success: true, is_favorite: nowFavorite, favorite_count: Number(updatedPrompt.favorite_count) });
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    res.status(500).json({ error: "Database error toggling favorite" });
  }
});

// 8. Toggle Visibility (Publish / Make Private)
app.post("/api/prompts/toggle-visibility", async (req, res) => {
  try {
    const { id, visibility } = req.body;
    if (!id || !visibility) return res.status(400).json({ error: "Missing parameters." });

    if (useMemoryDb) {
      const idx = memPrompts.findIndex(p => p.id === String(id));
      if (idx !== -1) {
        memPrompts[idx].visibility = visibility;
        memPrompts[idx].updated_at = new Date().toISOString();
        return res.json({ success: true, prompt: memPrompts[idx] });
      }
      return res.status(404).json({ error: "Prompt not found in memory" });
    } else {
      await sql`
        UPDATE prompts 
        SET visibility = ${visibility}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${id}
      `;
      // Fetch fresh
      const [freshRow] = await sql`SELECT * FROM prompts WHERE id = ${id}`;
      const [hydratedPrompt] = await hydratePostgresPrompts([freshRow]);
      return res.json({ success: true, prompt: hydratedPrompt });
    }
  } catch (error) {
    console.error("Error changing visibility:", error);
    res.status(500).json({ error: "Failed to shift visibility." });
  }
});

// 9. Record Action/Event (Copy, Use Template, View)
app.post("/api/prompts/record-event", async (req, res) => {
  try {
    const { id, eventType } = req.body; // eventType: 'copy', 'use_template', 'view'
    if (!id || !eventType) return res.status(400).json({ error: "Missing parameters" });

    if (useMemoryDb) {
      const idx = memPrompts.findIndex(p => p.id === String(id));
      if (idx !== -1) {
        memPrompts[idx].usage_count += 1;
        if (eventType === "copy") {
          memPrompts[idx].copy_count += 1;
        }
        return res.json({ success: true, usage_count: memPrompts[idx].usage_count, copy_count: memPrompts[idx].copy_count });
      }
      return res.status(404).json({ error: "Prompt not found" });
    } else {
      // Find user id
      const userRes = await sql`SELECT id FROM users WHERE email = ${CURRENT_USER_EMAIL} LIMIT 1`;
      const userId = userRes.length > 0 ? userRes[0].id : null;

      // Get prompt
      const promptRow = await sql`SELECT current_version_id, primary_tool_id FROM prompts WHERE id = ${id}`;
      if (promptRow.length === 0) return res.status(404).json({ error: "Prompt not found in DB" });

      const versionId = promptRow[0].current_version_id;
      const toolId = promptRow[0].primary_tool_id;

      // Insert event
      await sql`
        INSERT INTO prompt_usage_events (prompt_id, prompt_version_id, user_id, tool_id, event_type, source)
        VALUES (${id}, ${versionId}, ${userId}, ${toolId}, ${eventType}, 'web_app')
      `;

      // Update counters
      if (eventType === "copy") {
        await sql`UPDATE prompts SET copy_count = copy_count + 1, usage_count = usage_count + 1 WHERE id = ${id}`;
      } else {
        await sql`UPDATE prompts SET usage_count = usage_count + 1 WHERE id = ${id}`;
      }

      const [freshPrompt] = await sql`SELECT usage_count, copy_count FROM prompts WHERE id = ${id}`;
      return res.json({ success: true, usage_count: Number(freshPrompt.usage_count), copy_count: Number(freshPrompt.copy_count) });
    }
  } catch (error) {
    console.error("Error logging event:", error);
    res.status(500).json({ error: "Event logging error" });
  }
});

// Integrate with Vite on development or serve built files on production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 PEA Prompt Library Server ready and running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
