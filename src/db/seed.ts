import { db } from "@/db";
import {
  agencies,
  roles,
  users,
  workers,
  workerDocuments,
  workerSkills,
  workerLanguages,
  clients,
  recruitmentOrders,
  recruitmentCandidates,
  contracts,
  visas,
  travelRecords,
  invoices,
  payments,
  expenses,
  notifications,
  auditLogs,
  subscriptions,
} from "@/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  console.log("Starting database seeding for Recruitment Agency OS...");

  // 1. Check or create Demo Agency: Ethio-Gulf Star Recruitment PLC
  let demoAgency = await db.query.agencies.findFirst({
    where: eq(agencies.slug, "ethio-gulf-star"),
  });

  if (!demoAgency) {
    const [insertedAgency] = await db
      .insert(agencies)
      .values({
        name: "Ethio-Gulf Star Recruitment PLC",
        slug: "ethio-gulf-star",
        logoUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80",
        address: "Bole Road, Near Olympia, Addis Ababa, Ethiopia",
        phone: "+251 11 555 7890",
        email: "contact@ethio-gulfstar.com",
        status: "active",
      })
      .returning();
    demoAgency = insertedAgency;
  }

  const agencyId = demoAgency.id;

  // 2. Create Roles
  const existingRoles = await db.query.roles.findMany({
    where: eq(roles.agencyId, agencyId),
  });

  let ownerRole = existingRoles.find((r) => r.name === "AGENCY_OWNER");
  let managerRole = existingRoles.find((r) => r.name === "MANAGER");
  let recruiterRole = existingRoles.find((r) => r.name === "RECRUITMENT_OFFICER");
  let docRole = existingRoles.find((r) => r.name === "DOCUMENT_OFFICER");
  let accountantRole = existingRoles.find((r) => r.name === "ACCOUNTANT");

  if (!ownerRole) {
    const [r] = await db.insert(roles).values({ agencyId, name: "AGENCY_OWNER", description: "Full agency administration rights" }).returning();
    ownerRole = r;
  }
  if (!managerRole) {
    const [r] = await db.insert(roles).values({ agencyId, name: "MANAGER", description: "Branch or department manager" }).returning();
    managerRole = r;
  }
  if (!recruiterRole) {
    const [r] = await db.insert(roles).values({ agencyId, name: "RECRUITMENT_OFFICER", description: "Candidate sourcing and interviewing" }).returning();
    recruiterRole = r;
  }
  if (!docRole) {
    const [r] = await db.insert(roles).values({ agencyId, name: "DOCUMENT_OFFICER", description: "Visa, passport, and document processing" }).returning();
    docRole = r;
  }
  if (!accountantRole) {
    const [r] = await db.insert(roles).values({ agencyId, name: "ACCOUNTANT", description: "Invoices, payments, and expenses" }).returning();
    accountantRole = r;
  }

  // 3. Create Demo Users
  const hashedPassword = await bcrypt.hash("Demo1234!", 10);
  const demoUsersData = [
    { name: "Ato Dawit Mekonnen", email: "admin@ethio-gulf.com", roleId: ownerRole.id, phone: "+251911223344" },
    { name: "Wro Hiwot Tesfaye", email: "manager@ethio-gulf.com", roleId: managerRole.id, phone: "+251922334455" },
    { name: "Ephrem Tadesse", email: "recruiter@ethio-gulf.com", roleId: recruiterRole.id, phone: "+251933445566" },
    { name: "Samrawit Bekele", email: "doc@ethio-gulf.com", roleId: docRole.id, phone: "+251944556677" },
    { name: "Yared Lemma", email: "accountant@ethio-gulf.com", roleId: accountantRole.id, phone: "+251955667788" },
  ];

  const createdUsers = [];
  for (const ud of demoUsersData) {
    let user = await db.query.users.findFirst({
      where: (u, { and, eq }) => and(eq(u.agencyId, agencyId), eq(u.email, ud.email)),
    });
    if (!user) {
      const [ins] = await db
        .insert(users)
        .values({
          agencyId,
          roleId: ud.roleId,
          name: ud.name,
          email: ud.email,
          passwordHash: hashedPassword,
          phone: ud.phone,
          status: "active",
        })
        .returning();
      createdUsers.push(ins);
    } else {
      createdUsers.push(user);
    }
  }

  // 4. Create Active Subscription
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.agencyId, agencyId),
  });
  if (!existingSub) {
    await db.insert(subscriptions).values({
      agencyId,
      planName: "ENTERPRISE",
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  }

  // 5. Create 10 Clients (Saudi Employers / Agencies)
  const clientData = [
    { name: "Al-Jazeera Recruitment Riyadh", contactPerson: "Sheikh Mohammed Al-Thani", country: "Saudi Arabia", email: "contact@aljazeera-rec.sa", phone: "+966112345678", address: "King Fahd Road, Riyadh" },
    { name: "Riyadh Elite Services PLC", contactPerson: "Fahad Al-Otaibi", country: "Saudi Arabia", email: "info@riyadhelite.sa", phone: "+966119876543", address: "Al-Olaya District, Riyadh" },
    { name: "Jeddah Manpower Co.", contactPerson: "Tariq Bin Laden", country: "Saudi Arabia", email: "hr@jeddahmanpower.sa", phone: "+966126781234", address: "Corniche Road, Jeddah" },
    { name: "Dammam Domestic Agency", contactPerson: "Abdullah Al-Dosari", country: "Saudi Arabia", email: "support@dammamdom.sa", phone: "+966138901234", address: "King Khalid Street, Dammam" },
    { name: "Arabian Gulf Staffing", contactPerson: "Sultan Al-Harbi", country: "Saudi Arabia", email: "admin@gulfstaffing.sa", phone: "+966114567890", address: "Malaz, Riyadh" },
    { name: "Kingdom Recruitment Solutions", contactPerson: "Nasser Al-Qahtani", country: "Saudi Arabia", email: "nasser@kingdomrec.sa", phone: "+966113334455", address: "Diplomatic Quarter, Riyadh" },
    { name: "Al-Riyadh Care Services", contactPerson: "Mansour Al-Mutairi", country: "Saudi Arabia", email: "contact@riyadhcare.sa", phone: "+966116667788", address: "Al-Bathna, Riyadh" },
    { name: "Mecca Employment Bureau", contactPerson: "Ibrahim Al-Shehri", country: "Saudi Arabia", email: "ibrahim@meccajobs.sa", phone: "+966125554321", address: "Ibrahim Al-Khalil Road, Mecca" },
    { name: "Tabuk Manpower Agency", contactPerson: "Khalid Al-Balawi", country: "Saudi Arabia", email: "khalid@tabukmanpower.sa", phone: "+966144443322", address: "Main Street, Tabuk" },
    { name: "Abha Staffing PLC", contactPerson: "Ziyad Al-Shahrani", country: "Saudi Arabia", email: "ziyad@abhastaffing.sa", phone: "+966172221199", address: "Al-Soudah Road, Abha" },
  ];

  const createdClients = [];
  for (const cd of clientData) {
    let client = await db.query.clients.findFirst({
      where: (c, { and, eq }) => and(eq(c.agencyId, agencyId), eq(c.name, cd.name)),
    });
    if (!client) {
      const [ins] = await db.insert(clients).values({ agencyId, ...cd, status: "active" }).returning();
      createdClients.push(ins);
    } else {
      createdClients.push(client);
    }
  }

  // 6. Create 5 Recruitment Orders (Demand Orders)
  const orderData = [
    { orderNumber: "ORD-2026-001", position: "Housemaid / Domestic Worker", quantity: 10, filledQuantity: 6, salary: "1200.00", currency: "USD", status: "in_progress" },
    { orderNumber: "ORD-2026-002", position: "Private Driver", quantity: 5, filledQuantity: 3, salary: "1800.00", currency: "USD", status: "in_progress" },
    { orderNumber: "ORD-2026-003", position: "Elderly Caregiver", quantity: 4, filledQuantity: 2, salary: "1500.00", currency: "USD", status: "open" },
    { orderNumber: "ORD-2026-004", position: "Cook / Chef", quantity: 3, filledQuantity: 3, salary: "2000.00", currency: "USD", status: "completed" },
    { orderNumber: "ORD-2026-005", position: "Office Cleaner", quantity: 8, filledQuantity: 1, salary: "1000.00", currency: "USD", status: "open" },
  ];

  const createdOrders = [];
  for (let i = 0; i < orderData.length; i++) {
    const od = orderData[i];
    const client = createdClients[i % createdClients.length];
    let order = await db.query.recruitmentOrders.findFirst({
      where: (o, { and, eq }) => and(eq(o.agencyId, agencyId), eq(o.orderNumber, od.orderNumber)),
    });
    if (!order) {
      const [ins] = await db.insert(recruitmentOrders).values({ agencyId, clientId: client.id, ...od }).returning();
      createdOrders.push(ins);
    } else {
      createdOrders.push(order);
    }
  }

  // 7. Create 30 Realistic Ethiopian Workers
  const ethiopianNames = [
    { first: "Abebech", last: "Kebede", region: "Addis Ababa", gender: "female", skill: "housemaid", lang: "Arabic" },
    { first: "Tigist", last: "Bekele", region: "Oromia", gender: "female", skill: "cooking", lang: "Arabic" },
    { first: "Almaz", last: "Tadesse", region: "Amhara", gender: "female", skill: "childcare", lang: "English" },
    { first: "Mulugeta", last: "Alemu", region: "SNNPR", gender: "male", skill: "driving", lang: "Arabic" },
    { first: "Hirut", last: "Mekonnen", region: "Addis Ababa", gender: "female", skill: "elderly_care", lang: "Arabic" },
    { first: "Dawit", last: "Haile", region: "Oromia", gender: "male", skill: "driving", lang: "English" },
    { first: "Meron", last: "Tesfaye", region: "Amhara", gender: "female", skill: "housemaid", lang: "Arabic" },
    { first: "Yonas", last: "Getachew", region: "Sidama", gender: "male", skill: "cooking", lang: "Arabic" },
    { first: "Rahel", last: "Lemma", region: "Addis Ababa", gender: "female", skill: "childcare", lang: "English" },
    { first: "Solomon", last: "Assefa", region: "Oromia", gender: "male", skill: "driving", lang: "Arabic" },
    { first: "Semhar", last: "Teshome", region: "Tigray", gender: "female", skill: "housemaid", lang: "Arabic" },
    { first: "Esubalew", last: "Worku", region: "Amhara", gender: "male", skill: "driving", lang: "English" },
    { first: "Birtukan", last: "Demissie", region: "SNNPR", gender: "female", skill: "elderly_care", lang: "Arabic" },
    { first: "Kenenisa", last: "Bacha", region: "Oromia", gender: "male", skill: "cooking", lang: "Arabic" },
    { first: "Zenebech", last: "Tilahun", region: "Addis Ababa", gender: "female", skill: "housemaid", lang: "English" },
    { first: "Ephrem", last: "Kassa", region: "Amhara", gender: "male", skill: "driving", lang: "Arabic" },
    { first: "Fantu", last: "Admassu", region: "Oromia", gender: "female", skill: "childcare", lang: "Arabic" },
    { first: "Girma", last: "Wolde", region: "SNNPR", gender: "male", skill: "cooking", lang: "English" },
    { first: "Hanna", last: "Gebre", region: "Addis Ababa", gender: "female", skill: "housemaid", lang: "Arabic" },
    { first: "Jemal", last: "Mohammed", region: "Afar", gender: "male", skill: "driving", lang: "Arabic" },
    { first: "Khadija", last: "Ahmed", region: "Somali", gender: "female", skill: "cooking", lang: "Arabic" },
    { first: "Lensa", last: "Deressa", region: "Oromia", gender: "female", skill: "housemaid", lang: "English" },
    { first: "Mesfin", last: "Negash", region: "Amhara", gender: "male", skill: "driving", lang: "Arabic" },
    { first: "Netsanet", last: "Mamo", region: "Addis Ababa", gender: "female", skill: "childcare", lang: "English" },
    { first: "Oumer", last: "Sultan", region: "Harari", gender: "male", skill: "cooking", lang: "Arabic" },
    { first: "Peniel", last: "Yilma", region: "SNNPR", gender: "female", skill: "housemaid", lang: "Arabic" },
    { first: "Qanani", last: "Gada", region: "Oromia", gender: "female", skill: "elderly_care", lang: "English" },
    { first: "Rediet", last: "Shiferaw", region: "Addis Ababa", gender: "female", skill: "housemaid", lang: "Arabic" },
    { first: "Samuel", last: "Berhane", region: "Tigray", gender: "male", skill: "driving", lang: "Arabic" },
    { first: "Tsige", last: "Wondwossen", region: "Amhara", gender: "female", skill: "cooking", lang: "Arabic" },
  ];

  const statuses = ["available", "processing", "deployed", "blacklisted", "returned"] as const;

  const createdWorkers = [];
  for (let i = 0; i < ethiopianNames.length; i++) {
    const item = ethiopianNames[i];
    const passportNumber = `EP${10001 + i}`;
    const status = statuses[i % statuses.length];

    let worker = await db.query.workers.findFirst({
      where: (w, { and, eq }) => and(eq(w.agencyId, agencyId), eq(w.passportNumber, passportNumber)),
    });

    if (!worker) {
      const [ins] = await db
        .insert(workers)
        .values({
          agencyId,
          firstName: item.first,
          lastName: item.last,
          middleName: "Habte",
          dateOfBirth: new Date(1992 + (i % 8), (i % 12), (i % 25) + 1),
          gender: item.gender,
          nationality: "Ethiopian",
          passportNumber,
          passportExpiryDate: new Date(2030 + (i % 4), 5, 15),
          phone: `+2519${(10000000 + i * 12345).toString().substring(0, 8)}`,
          email: `${item.first.toLowerCase()}.${item.last.toLowerCase()}@example.et`,
          address: `${item.region}, Ethiopia`,
          status,
          notes: `Reliable candidate with verified experience in ${item.skill}.`,
        })
        .returning();
      worker = ins;

      // Add skills
      await db.insert(workerSkills).values({
        agencyId,
        workerId: worker.id,
        skillName: item.skill,
        experienceYears: 2 + (i % 5),
        proficiencyLevel: i % 2 === 0 ? "expert" : "intermediate",
      });

      // Add languages
      await db.insert(workerLanguages).values({
        agencyId,
        workerId: worker.id,
        language: item.lang,
        proficiency: "fluent",
      });
    }
    createdWorkers.push(worker);
  }

  // 8. Create Candidates (Linking Workers to Orders)
  for (let i = 0; i < createdWorkers.length; i++) {
    const worker = createdWorkers[i];
    const order = createdOrders[i % createdOrders.length];

    const existingCandidate = await db.query.recruitmentCandidates.findFirst({
      where: (c, { and, eq }) => and(eq(c.agencyId, agencyId), eq(c.workerId, worker.id), eq(c.orderId, order.id)),
    });

    if (!existingCandidate) {
      const candidateStatuses = ["nominated", "shortlisted", "interviewed", "medical_pending", "visa_processing", "deployed", "rejected"] as const;
      await db.insert(recruitmentCandidates).values({
        agencyId,
        orderId: order.id,
        workerId: worker.id,
        status: candidateStatuses[i % candidateStatuses.length],
        notes: "Automated seed candidate pipeline record.",
      });
    }
  }

  // 9. Create 20 Worker Documents
  const docTypes = ["passport", "medical", "police_clearance", "training_cert", "contract", "visa"] as const;
  let docCount = 0;
  for (let i = 0; i < createdWorkers.length && docCount < 20; i++) {
    const worker = createdWorkers[i];
    const docType = docTypes[i % docTypes.length];

    const existingDoc = await db.query.workerDocuments.findFirst({
      where: (d, { and, eq }) => and(eq(d.agencyId, agencyId), eq(d.workerId, worker.id), eq(d.documentType, docType)),
    });

    if (!existingDoc) {
      await db.insert(workerDocuments).values({
        agencyId,
        workerId: worker.id,
        documentType: docType,
        documentNumber: `DOC-${worker.passportNumber}-${docType.toUpperCase()}`,
        fileUrl: `https://storage.googleapis.com/recruitment-os-demo/${worker.passportNumber}_${docType}.pdf`,
        issueDate: new Date(2025, 0, 10),
        expiryDate: new Date(2030, 0, 10),
        status: "verified",
      });
      docCount++;
    }
  }

  // 10. Create 10 Contracts
  let contractCount = 0;
  for (let i = 0; i < createdWorkers.length && contractCount < 10; i++) {
    const worker = createdWorkers[i];
    const client = createdClients[i % createdClients.length];
    const contractNumber = `CNT-2026-${100 + i}`;

    const existingContract = await db.query.contracts.findFirst({
      where: (c, { and, eq }) => and(eq(c.agencyId, agencyId), eq(c.contractNumber, contractNumber)),
    });

    if (!existingContract) {
      await db.insert(contracts).values({
        agencyId,
        workerId: worker.id,
        clientId: client.id,
        contractNumber,
        startDate: new Date(2026, 2, 1),
        endDate: new Date(2028, 2, 1),
        salary: "1200.00",
        terms: { accommodation: "provided", food: "provided", flightTicket: "roundtrip" },
        status: "active",
      });
      contractCount++;
    }
  }

  // 11. Create 10 Invoices and Payments
  let invoiceCount = 0;
  for (let i = 0; i < createdClients.length && invoiceCount < 10; i++) {
    const client = createdClients[i];
    const invoiceNumber = `INV-2026-${500 + i}`;

    let invoice = await db.query.invoices.findFirst({
      where: (inv, { and, eq }) => and(eq(inv.agencyId, agencyId), eq(inv.invoiceNumber, invoiceNumber)),
    });

    if (!invoice) {
      const [insInv] = await db
        .insert(invoices)
        .values({
          agencyId,
          clientId: client.id,
          invoiceNumber,
          amount: "3500.00",
          taxAmount: "175.00",
          currency: "USD",
          dueDate: new Date(2026, 5, 30),
          status: "paid",
        })
        .returning();
      invoice = insInv;

      await db.insert(payments).values({
        agencyId,
        invoiceId: invoice.id,
        amount: "3675.00",
        currency: "USD",
        paymentMethod: "bank_transfer",
        referenceNumber: `TXN-REF-${9000 + i}`,
        paymentDate: new Date(),
        status: "completed",
      });
      invoiceCount++;
    }
  }

  // 12. Create Notifications & Audit Logs
  await db.insert(notifications).values([
    {
      agencyId,
      userId: createdUsers[0]?.id,
      title: "System Seeding Complete",
      message: "Ethio-Gulf Star Recruitment PLC demo environment successfully provisioned with 30 workers and 10 clients.",
      isRead: false,
    },
    {
      agencyId,
      userId: createdUsers[0]?.id,
      title: "Passport Expiry Alert",
      message: "Worker Abebech Kebede (EP10001) passport verified.",
      isRead: true,
    },
  ]);

  await db.insert(auditLogs).values({
    agencyId,
    userId: createdUsers[0]?.id,
    action: "SEED_DATABASE",
    entity: "agency",
    entityId: agencyId,
    details: { seededBy: "system", workerCount: 30, clientCount: 10 },
  });

  console.log("Database seeding completed successfully.");
  return { success: true, agencyId, agencyName: demoAgency.name };
}
