import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, generateAdmissionNo, generateInvoiceNo, generatePaymentNo } from "@/lib/auth";

const FIRST_NAMES_M = ["Chinedu","Emeka","Ibrahim","Musa","Tunde","Bola","Sani","Yakubu","Oluwaseun","Chukwuemeka","Abdullahi","Samuel","David","Joshua","Daniel","Michael","Peter","Paul","James","John","Christopher","Augustine","Barnabas","Clement","Dominic"];
const FIRST_NAMES_F = ["Aisha","Fatima","Chidinma","Ngozi","Blessing","Grace","Mary","Esther","Joy","Faith","Patience","Comfort","Rosemary","Victoria","Sarah","Rebecca","Rachael","Hannah","Deborah","Priscilla","Elizabeth","Mercy","Precious","Glory","Divine"];
const LAST_NAMES = ["Okafor","Adeyemi","Ibrahim","Mohammed","Okonkwo","Eze","Nwosu","Adeleke","Bello","Danjuma","Oyelaran","Dung","Pam","Chollom","Gyang","Dungji","Mafuyai","Mang","Lohor","Shinggu","Kumzak","Williams","Johnson","Okafor","Adebayo"];
const NIGERIAN_CITIES = ["Jos","Lagos","Abuja","Kano","Ibadan","Port Harcourt","Kaduna","Enugu","Benin City","Kaduna"];

function randomItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randomDate(start: Date, end: Date) { return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())); }

export async function POST(req: NextRequest) {
  try {
    const settings = await db.systemSetting.findFirst();
    if (!settings?.isInstalled) {
      return NextResponse.json({ error: "System not installed" }, { status: 400 });
    }

    const session = await db.session.findFirst({ where: { isDefault: true } });
    if (!session) return NextResponse.json({ error: "No active session" }, { status: 400 });

    const classes = await db.class.findMany({ include: { sections: true } });
    const departments = await db.department.findMany();
    const designations = await db.designation.findMany();
    const houses = await db.house.findMany();
    const subjects = await db.subject.findMany();

    // Create staff
    const staffUsers: any[] = [];
    const staffData = [
      { role: "Admin", desig: "Principal", dept: "Academic", count: 1 },
      { role: "Admin", desig: "Vice Principal", dept: "Academic", count: 1 },
      { role: "Teacher", desig: "Teacher", dept: "Academic", count: 15 },
      { role: "Accountant", desig: "Accountant", dept: "Finance", count: 2 },
      { role: "Receptionist", desig: "Clerk", dept: "Administration", count: 1 },
      { role: "Librarian", desig: "Librarian", dept: "Library", count: 1 },
    ];

    let staffCounter = 1;
    for (const sd of staffData) {
      const dept = departments.find(d => d.name === sd.dept);
      const desig = designations.find(d => d.name === sd.desig);
      for (let i = 0; i < sd.count; i++) {
        const gender = Math.random() > 0.4 ? "Male" : "Female";
        const firstName = gender === "Male" ? randomItem(FIRST_NAMES_M) : randomItem(FIRST_NAMES_F);
        const lastName = randomItem(LAST_NAMES);
        const staffId = `EMP-${String(staffCounter).padStart(3, "0")}`;
        const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${staffCounter}`;
        const basicSalary = sd.desig === "Principal" ? 350000 : sd.desig === "Vice Principal" ? 280000 : sd.desig === "Teacher" ? 120000 : sd.desig === "Accountant" ? 150000 : 80000;

        const staff = await db.staff.create({
          data: {
            staffId,
            firstName,
            lastName,
            gender,
            dateOfBirth: randomDate(new Date(1970, 0, 1), new Date(1995, 11, 31)),
            bloodGroup: randomItem(["A+","B+","O+","AB+","O-"]),
            nationality: "Nigerian",
            stateOfOrigin: randomItem(["Plateau","Lagos","Kano","Enugu","Rivers","Kaduna"]),
            phone: `+234 80${Math.floor(Math.random() * 90000000 + 10000000)}`,
            email: `${username}@smartschool.edu.ng`,
            address: `${Math.floor(Math.random() * 100)} ${randomItem(["Murtala Mohammed Way","Tafawa Balewa Road","Ahmadu Bello Crescent","Yakubu Gowon Way"])}, ${randomItem(NIGERIAN_CITIES)}`,
            city: randomItem(NIGERIAN_CITIES),
            state: randomItem(["Plateau","Lagos","Kano","Enugu","Rivers"]),
            qualification: randomItem(["B.Sc","B.Ed","M.Sc","NCE","HND"]),
            experience: `${Math.floor(Math.random() * 20 + 1)} years`,
            joiningDate: randomDate(new Date(2015, 0, 1), new Date(2024, 0, 1)),
            departmentId: dept?.id,
            designationId: desig?.id,
            basicSalary,
            houseAllowance: basicSalary * 0.1,
            transportAllowance: basicSalary * 0.08,
            medicalAllowance: basicSalary * 0.05,
          },
        });

        const user = await db.user.create({
          data: {
            username,
            email: staff.email!,
            password: hashPassword("password123"),
            role: sd.role as any,
            staffId: staff.id,
            isActive: true,
          },
        });
        staffUsers.push({ staff, user, role: sd.role });
        staffCounter++;
      }
    }

    // Assign class teachers
    const teachers = staffUsers.filter(s => s.role === "Teacher");
    for (const cls of classes.slice(5, 17)) {
      for (const section of cls.sections) {
        const teacher = randomItem(teachers);
        if (teacher) {
          await db.classTeacher.create({
            data: { classId: cls.id, sectionId: section.id, staffId: teacher.staff.id },
          }).catch(() => {});
        }
      }
    }

    // Assign subject teachers
    for (const cls of classes.slice(5, 17)) {
      for (let i = 0; i < 6; i++) {
        const subj = randomItem(subjects);
        const teacher = randomItem(teachers);
        if (subj && teacher) {
          await db.subjectTeacher.create({
            data: { subjectId: subj.id, classId: cls.id, staffId: teacher.staff.id },
          }).catch(() => {});
        }
      }
    }

    // Create parents and students
    const studentsCreated: any[] = [];
    for (let i = 0; i < 80; i++) {
      const gender = Math.random() > 0.48 ? "Male" : "Female";
      const firstName = gender === "Male" ? randomItem(FIRST_NAMES_M) : randomItem(FIRST_NAMES_F);
      const lastName = randomItem(LAST_NAMES);
      const cls = randomItem(classes.slice(5, 17));
      const section = randomItem(cls.sections);
      const house = randomItem(houses);

      const parent = await db.parent.create({
        data: {
          firstName: randomItem(FIRST_NAMES_M),
          lastName,
          relation: "Father",
          occupation: randomItem(["Civil Servant","Business","Trading","Farmer","Engineer","Doctor","Lawyer","Teacher"]),
          phone: `+234 80${Math.floor(Math.random() * 90000000 + 10000000)}`,
          email: `parent${i}@gmail.com`,
          address: `${Math.floor(Math.random() * 100)} ${randomItem(["Murtala Mohammed Way","Tafawa Balewa Road","Yakubu Gowon Way"])}, ${randomItem(NIGERIAN_CITIES)}`,
          city: randomItem(NIGERIAN_CITIES),
          state: randomItem(["Plateau","Lagos","Kano","Enugu"]),
        },
      });

      const admissionNo = generateAdmissionNo();
      const student = await db.student.create({
        data: {
          admissionNo,
          firstName,
          lastName,
          gender,
          dateOfBirth: randomDate(new Date(2008, 0, 1), new Date(2018, 11, 31)),
          bloodGroup: randomItem(["A+","B+","O+","AB+"]),
          nationality: "Nigerian",
          stateOfOrigin: randomItem(["Plateau","Lagos","Kano","Enugu","Rivers"]),
          lga: randomItem(["Jos North","Jos South","Bassa","Pankshin","Mangu"]),
          religion: randomItem(["Christianity","Islam"]),
          admissionDate: randomDate(new Date(2023, 0, 1), new Date()),
          admissionClass: cls.name,
          currentClassId: cls.id,
          sectionId: section.id,
          sessionId: session.id,
          rollNo: i + 1,
          houseId: house?.id,
          phone: `+234 70${Math.floor(Math.random() * 90000000 + 10000000)}`,
          address: `${Math.floor(Math.random() * 100)} ${randomItem(["Murtala Mohammed Way","Tafawa Balewa Road"])}, ${randomItem(NIGERIAN_CITIES)}`,
          city: randomItem(NIGERIAN_CITIES),
          state: randomItem(["Plateau","Lagos","Kano"]),
          parentId: parent.id,
        },
      });

      // Create user account for student
      await db.user.create({
        data: {
          username: admissionNo.toLowerCase().replace(/\//g, ""),
          email: `${admissionNo.toLowerCase().replace(/\//g, "")}@smartschool.edu.ng`,
          password: hashPassword("student123"),
          role: "Student",
          studentId: student.id,
          isActive: true,
        },
      });

      // Create parent user
      await db.user.create({
        data: {
          username: `parent.${admissionNo.toLowerCase().replace(/\//g, "")}`,
          email: parent.email!,
          password: hashPassword("parent123"),
          role: "Parent",
          parentId: parent.id,
          isActive: true,
        },
      });

      studentsCreated.push(student);
    }

    // Create fee types
    const feeTypes = [
      { name: "Tuition Fee", amount: 85000, type: "Yearly" },
      { name: "Admission Fee", amount: 25000, type: "One Time" },
      { name: "PTA Levy", amount: 5000, type: "Yearly" },
      { name: "Sports Fee", amount: 3000, type: "Yearly" },
      { name: "Library Fee", amount: 2000, type: "Yearly" },
      { name: "Laboratory Fee", amount: 5000, type: "Yearly" },
      { name: "Hostel Fee", amount: 120000, type: "Yearly" },
      { name: "Transport Fee", amount: 45000, type: "Yearly" },
    ];
    for (const ft of feeTypes) {
      await db.feeType.create({ data: { ...ft, sessionId: session.id, isActive: true } });
    }

    // Create invoices and payments for students
    const allFeeTypes = await db.feeType.findMany();
    for (const student of studentsCreated) {
      const tuition = allFeeTypes.find(f => f.name === "Tuition Fee");
      const pta = allFeeTypes.find(f => f.name === "PTA Levy");
      if (tuition && pta) {
        const totalAmount = tuition.amount + pta.amount;
        const discount = Math.random() > 0.7 ? Math.floor(totalAmount * 0.1) : 0;
        const paidAmount = Math.random() > 0.3 ? totalAmount - discount : Math.floor((totalAmount - discount) * 0.5);
        const balance = totalAmount - discount - paidAmount;

        const invoice = await db.invoice.create({
          data: {
            invoiceNo: generateInvoiceNo(),
            studentId: student.id,
            feeTypeId: tuition.id,
            amount: totalAmount,
            discount,
            paidAmount,
            balance,
            status: balance === 0 ? "Paid" : paidAmount > 0 ? "Partial" : "Unpaid",
            dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15),
            sessionId: session.id,
          },
        });

        if (paidAmount > 0) {
          await db.feePayment.create({
            data: {
              paymentNo: generatePaymentNo(),
              invoiceId: invoice.id,
              studentId: student.id,
              amount: paidAmount,
              paymentMode: randomItem(["Cash","Bank Transfer","POS","Online"]),
              paymentDate: randomDate(new Date(new Date().getFullYear(), 0, 1), new Date()),
              collectedBy: "Accountant",
              sessionId: session.id,
            },
          });
        }
      }
    }

    // Create books
    const bookData = [
      { title: "New General Mathematics for JSS", author: "M.F. Macrae", category: "Mathematics", price: 2500, qty: 50 },
      { title: "English Language for Senior Secondary", author: "P.S. Olatunbosun", category: "English", price: 2200, qty: 40 },
      { title: "Senior Secondary Physics", author: "P.N. Okeke", category: "Physics", price: 3500, qty: 30 },
      { title: "Comprehensive Chemistry", author: "G.N. Ugo", category: "Chemistry", price: 3200, qty: 35 },
      { title: "Modern Biology", author: "S.O. Ibe", category: "Biology", price: 3000, qty: 28 },
      { title: "Nigerian History and Culture", author: "A. Fajana", category: "History", price: 1800, qty: 45 },
      { title: "Principles of Economics", author: "O.A. Anyanwu", category: "Economics", price: 2800, qty: 25 },
      { title: "Agricultural Science for Schools", author: "E.O. Uwalaka", category: "Agriculture", price: 2600, qty: 32 },
      { title: "Computer Studies Basics", author: "T. Ojo", category: "Computer", price: 2400, qty: 40 },
      { title: "Further Mathematics", author: "E. Egbe", category: "Mathematics", price: 4000, qty: 20 },
    ];
    for (let i = 0; i < bookData.length; i++) {
      const b = bookData[i];
      await db.book.create({
        data: {
          bookNo: `BK-${String(i + 1).padStart(4, "0")}`,
          title: b.title,
          author: b.author,
          category: b.category,
          price: b.price,
          quantity: b.qty,
          available: b.qty,
          rack: `Rack-${String.fromCharCode(65 + i)}`,
        },
      });
    }

    // Issue some books
    for (let i = 0; i < 15; i++) {
      const book = await db.book.findFirst({ skip: Math.floor(Math.random() * 10), take: 1 });
      const student = randomItem(studentsCreated);
      if (book && student && book.available > 0) {
        const issueDate = randomDate(new Date(2024, 0, 1), new Date());
        await db.bookIssue.create({
          data: {
            bookId: book.id,
            studentId: student.id,
            issueDate,
            dueDate: new Date(issueDate.getTime() + 14 * 24 * 60 * 60 * 1000),
            status: "Issued",
          },
        });
        await db.book.update({ where: { id: book.id }, data: { available: { decrement: 1 } } });
      }
    }

    // Create admission enquiries
    const enquirySources = ["Walk-in", "Phone", "Website", "Referral"];
    for (let i = 0; i < 12; i++) {
      const firstName = randomItem(FIRST_NAMES_M.concat(FIRST_NAMES_F));
      await db.admissionEnquiry.create({
        data: {
          enquiryNo: `ENQ-${String(i + 1).padStart(4, "0")}`,
          firstName,
          lastName: randomItem(LAST_NAMES),
          phone: `+234 80${Math.floor(Math.random() * 90000000 + 10000000)}`,
          email: `enquiry${i}@gmail.com`,
          classApplied: randomItem(classes).name,
          source: randomItem(enquirySources),
          description: "Interested in admission for my child",
          status: randomItem(["Active","Active","Admitted","Closed"]),
          date: randomDate(new Date(2024, 0, 1), new Date()),
        },
      });
    }

    // Create visitors
    for (let i = 0; i < 10; i++) {
      await db.visitor.create({
        data: {
          visitorName: `${randomItem(FIRST_NAMES_M)} ${randomItem(LAST_NAMES)}`,
          phone: `+234 80${Math.floor(Math.random() * 90000000 + 10000000)}`,
          purpose: randomItem(["Admission Enquiry","Meeting with Principal","Fee Payment","Collect Child","Official Visit"]),
          whomToMeet: randomItem(["Principal","Vice Principal","Class Teacher","Accountant"]),
          checkIn: randomDate(new Date(2024, 0, 1), new Date()),
          noOfPerson: Math.floor(Math.random() * 3 + 1),
        },
      });
    }

    // Create phone call logs
    for (let i = 0; i < 8; i++) {
      await db.phoneCallLog.create({
        data: {
          callType: randomItem(["Incoming","Outgoing"]),
          name: `${randomItem(FIRST_NAMES_M)} ${randomItem(LAST_NAMES)}`,
          phone: `+234 80${Math.floor(Math.random() * 90000000 + 10000000)}`,
          date: randomDate(new Date(2024, 0, 1), new Date()),
          duration: `${Math.floor(Math.random() * 15 + 1)} min`,
          note: randomItem(["Fee enquiry","Admission information","Complaint about child","Schedule meeting","General enquiry"]),
        },
      });
    }

    // Create complaints
    const complaintTypes = ["Infrastructure","Staff Behavior","Academic","Bullying","Fees","Transport","Facilities"];
    for (let i = 0; i < 6; i++) {
      await db.complain.create({
        data: {
          complainNo: `CMP-${String(i + 1).padStart(4, "0")}`,
          source: randomItem(["Parent","Student","Staff"]),
          name: `${randomItem(FIRST_NAMES_M)} ${randomItem(LAST_NAMES)}`,
          phone: `+234 80${Math.floor(Math.random() * 90000000 + 10000000)}`,
          complainType: randomItem(complaintTypes),
          complain: randomItem(["Poor toilet facilities","Teacher absent frequently","Bullying in class","Bus always late","School environment not clean"]),
          date: randomDate(new Date(2024, 0, 1), new Date()),
          status: randomItem(["Pending","In Progress","Resolved"]),
        },
      });
    }

    // Create homework
    const teacherStaff = await db.staff.findFirst({ where: { designation: { name: "Teacher" } } });
    const homeworkTitles = [
      "Exercise 5 - Algebra", "Reading Comprehension", "Chemistry Lab Report",
      "Essay: My Country Nigeria", "Maths Worksheet 3", "History Assignment",
      "Physics Problems Set 2", "Biology Diagram Practice",
    ];
    for (let i = 0; i < 8; i++) {
      const cls = randomItem(classes.slice(5, 17));
      const section = randomItem(cls.sections);
      const subj = randomItem(subjects);
      await db.homework.create({
        data: {
          title: randomItem(homeworkTitles),
          description: "Complete the exercises and submit by the due date.",
          classId: cls.id,
          sectionId: section.id,
          subjectId: subj?.id,
          homeworkDate: new Date(),
          submissionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: teacherStaff?.id,
        },
      });
    }

    // Create calendar events
    const events = [
      { title: "First Term Begins", type: "Event", startDate: new Date(2024, 8, 9), color: "#16a34a" },
      { title: "Independence Day Celebration", type: "Event", startDate: new Date(2024, 9, 1), color: "#16a34a" },
      { title: "Mid-Term Break", type: "Holiday", startDate: new Date(2024, 10, 4), endDate: new Date(2024, 10, 8), color: "#ca8a04" },
      { title: "PTA Meeting", type: "Meeting", startDate: new Date(2024, 10, 15), color: "#0891b2" },
      { title: "First Term Examination", type: "Exam", startDate: new Date(2024, 11, 2), endDate: new Date(2024, 11, 13), color: "#dc2626" },
      { title: "Christmas Break", type: "Holiday", startDate: new Date(2024, 11, 20), endDate: new Date(2025, 0, 7), color: "#ca8a04" },
      { title: "Inter-House Sports", type: "Event", startDate: new Date(2025, 1, 14), color: "#16a34a" },
      { title: "Cultural Day", type: "Event", startDate: new Date(2025, 2, 20), color: "#7c3aed" },
    ];
    for (const e of events) {
      await db.calendarEvent.create({ data: e });
    }

    // Create tasks
    const tasks = [
      { title: "Prepare first term examination papers", priority: "High", status: "In Progress", dueDate: new Date(Date.now() + 7 * 86400000) },
      { title: "Update student records", priority: "Medium", status: "Pending", dueDate: new Date(Date.now() + 3 * 86400000) },
      { title: "Organize PTA meeting agenda", priority: "High", status: "Pending", dueDate: new Date(Date.now() + 5 * 86400000) },
      { title: "Audit library books", priority: "Low", status: "Pending", dueDate: new Date(Date.now() + 14 * 86400000) },
      { title: "Review fee defaulters list", priority: "Medium", status: "Completed", dueDate: new Date(Date.now() - 2 * 86400000) },
    ];
    for (const t of tasks) {
      await db.task.create({ data: t });
    }

    // Create leave types
    const leaveTypes = [
      { name: "Annual Leave", code: "AL", days: 30 },
      { name: "Sick Leave", code: "SL", days: 14 },
      { name: "Casual Leave", code: "CL", days: 10 },
      { name: "Maternity Leave", code: "ML", days: 90 },
      { name: "Paternity Leave", code: "PL", days: 7 },
    ];
    for (const lt of leaveTypes) {
      await db.leaveType.create({ data: lt });
    }

    // Create some leave requests
    const allStaff = await db.staff.findMany({ take: 5 });
    const allLeaveTypes = await db.leaveType.findMany();
    for (let i = 0; i < 4; i++) {
      const staff = randomItem(allStaff);
      const lt = randomItem(allLeaveTypes);
      const from = randomDate(new Date(), new Date(Date.now() + 30 * 86400000));
      await db.leaveRequest.create({
        data: {
          staffId: staff.id,
          leaveTypeId: lt.id,
          fromDate: from,
          toDate: new Date(from.getTime() + 3 * 86400000),
          days: 3,
          reason: randomItem(["Family emergency","Medical appointment","Personal work","Attending a function"]),
          status: randomItem(["Pending","Approved","Pending"]),
        },
      });
    }

    // Create hostel
    const hostel = await db.hostel.create({
      data: { name: "Boarding House A", type: "Boys", address: "School Campus", capacity: 100 },
    });
    for (let i = 1; i <= 20; i++) {
      await db.hostelRoom.create({
        data: { hostelId: hostel.id, roomNo: `R${i}`, roomType: "Shared", capacity: 4, fee: 120000 },
      });
    }
    // Allot some students to hostel
    const rooms = await db.hostelRoom.findMany();
    for (let i = 0; i < 10 && i < studentsCreated.length; i++) {
      await db.student.update({
        where: { id: studentsCreated[i].id },
        data: { hostelRoomId: randomItem(rooms).id },
      });
    }

    // Create transport routes
    const routes = [
      { routeName: "Route 1 - Jos North", vehicleNo: "LSR-234XA", driverName: "Musa Abdullahi", driverPhone: "+234 8031234567", startPoint: "Terminus", endPoint: "School", fare: 45000, capacity: 30 },
      { routeName: "Route 2 - Jos South", vehicleNo: "LSR-567XB", driverName: "John Pam", driverPhone: "+234 8037654321", startPoint: "Bukuru", endPoint: "School", fare: 45000, capacity: 30 },
      { routeName: "Route 3 - Rayfield", vehicleNo: "LSR-890XC", driverName: "David Chollom", driverPhone: "+234 8039876543", startPoint: "Rayfield", endPoint: "School", fare: 40000, capacity: 25 },
    ];
    for (const r of routes) {
      await db.transportRoute.create({ data: r });
    }
    // Allot transport to some students
    const allRoutes = await db.transportRoute.findMany();
    for (let i = 10; i < 25 && i < studentsCreated.length; i++) {
      await db.student.update({
        where: { id: studentsCreated[i].id },
        data: { transportRouteId: randomItem(allRoutes).id },
      });
    }

    // Create CMS content
    await db.news.create({
      data: {
        title: "Smart School Wins National Education Award 2024",
        slug: "smart-school-wins-award-2024",
        content: "We are proud to announce that Smart School has been awarded the National Education Excellence Award for the year 2024.",
        excerpt: "Smart School recognized for excellence in education delivery.",
        category: "Achievement",
        publishedAt: new Date(),
      },
    });
    await db.news.create({
      data: {
        title: "Admission Open for 2024/2025 Session",
        slug: "admission-open-2024-2025",
        content: "Applications are now open for admission into all classes for the 2024/2025 academic session.",
        excerpt: "Apply now for the 2024/2025 academic session.",
        category: "Admission",
        publishedAt: new Date(Date.now() - 86400000),
      },
    });

    await db.event.create({
      data: {
        title: "Annual Inter-House Sports Competition",
        description: "Join us for our annual inter-house sports competition featuring track events, football, and more.",
        startDate: new Date(2025, 1, 14),
        endDate: new Date(2025, 1, 15),
        location: "School Sports Ground",
        status: "Upcoming",
      },
    });

    await db.page.create({
      data: {
        title: "About Us",
        slug: "about-us",
        content: "Smart School is a leading educational institution committed to providing quality education to students in Nigeria. Located in Jos, Plateau State, we offer comprehensive education from Creche to SSS 3.",
        excerpt: "Learn about our school's mission and values.",
        status: "Published",
      },
    });
    await db.page.create({
      data: {
        title: "Admission Procedure",
        slug: "admission-procedure",
        content: "Our admission process is simple and transparent. Prospective students undergo an entrance examination followed by an interview.",
        excerpt: "How to apply for admission.",
        status: "Published",
      },
    });

    // Create banners
    await db.banner.createMany({
      data: [
        { title: "Welcome to Smart School", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1200", description: "Quality Education for All", position: 0 },
        { title: "Admission Open 2024/2025", image: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1200", description: "Apply Now", position: 1 },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Demo data seeded successfully",
      data: {
        staff: staffCounter - 1,
        students: studentsCreated.length,
      },
    });
  } catch (e: any) {
    console.error("Seed error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
