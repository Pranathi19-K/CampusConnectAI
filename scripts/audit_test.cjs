const http = require("http");

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
          json,
        });
      });
    });

    req.on("error", (err) => reject(err));

    if (postData) {
      if (typeof postData === "string" || Buffer.isBuffer(postData)) {
        req.write(postData);
      } else {
        req.setHeader("Content-Type", "application/json");
        req.write(JSON.stringify(postData));
      }
    }
    req.end();
  });
}

async function runAudit() {
  console.log("=== MULTI-COLLEGE TENANT ISOLATION & AUDIT TEST SUITE ===");
  const results = [];

  function record(testName, passed, details = "") {
    results.push({ testName, passed, details });
    console.log(
      `${passed ? "✅ PASS" : "❌ FAIL"}: ${testName}${details ? " - " + details : ""}`
    );
  }

  try {
    // 1. Health check & Persistence Disclosure
    const health = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/health",
      method: "GET",
    });
    record(
      "Health Check & Persistence Disclosure",
      health.statusCode === 200 && health.json?.platform === "multi-college",
      `Platform: ${health.json?.platform}, Mode: ${health.json?.persistence}`
    );

    // 2. Fetch Colleges Directory
    const collegesRes = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/colleges",
      method: "GET",
    });
    const collegesList = collegesRes.json?.colleges || [];
    const collegeApex = collegesList.find((c) => c.slug === "apex-tech") || collegesList[0];
    const collegeMetro = collegesList.find((c) => c.slug === "metro-state") || collegesList[1];

    record(
      "Public Colleges Directory (/api/colleges)",
      collegesRes.statusCode === 200 && collegesList.length >= 2,
      `Retrieved ${collegesList.length} approved active colleges (Found: ${collegeApex?.name}, ${collegeMetro?.name})`
    );

    // 3. Platform Super Admin Login
    const superAdminLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/admin/login",
        method: "POST",
      },
      {
        email: "admin@campusconnect.edu",
        password: "adminPassword123",
      }
    );
    const superAdminToken = superAdminLogin.json?.token;
    record(
      "Super Admin Login (/api/admin/login)",
      superAdminLogin.statusCode === 200 && Boolean(superAdminToken),
      `Super admin JWT issued: ${Boolean(superAdminToken)}`
    );

    // 4. Super Admin Platform Stats & College List
    const superStats = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/superadmin/stats",
      method: "GET",
      headers: { Authorization: `Bearer ${superAdminToken}` },
    });
    record(
      "Super Admin Platform Stats (/api/superadmin/stats)",
      superStats.statusCode === 200 && typeof superStats.json?.colleges === "number",
      `Colleges: ${superStats.json?.colleges}, Students: ${superStats.json?.students}`
    );

    // 5. Register College A Student
    const rollA = "AIT" + Math.floor(1000 + Math.random() * 9000);
    const studentAReg = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/api/colleges/${collegeApex._id}/students/register`,
        method: "POST",
      },
      {
        name: "Apex Student A",
        email: `student_${rollA.toLowerCase()}@apextech.edu`,
        rollNumber: rollA,
        department: "Computer Science",
        year: 3,
        password: "StudentPassA123!",
      }
    );
    record(
      "Student Registration in College A (/api/colleges/:colA/students/register)",
      studentAReg.statusCode === 201 && Boolean(studentAReg.json?.student?.id || studentAReg.json?.student?._id),
      `Enrolled at: ${collegeApex.name}`
    );

    // 6. Student Login in College A
    const studentALogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/api/colleges/${collegeApex._id}/students/login`,
        method: "POST",
      },
      {
        email: `student_${rollA.toLowerCase()}@apextech.edu`,
        password: "StudentPassA123!",
      }
    );
    const studentAToken = studentALogin.json?.token;
    record(
      "Student Login in College A",
      studentALogin.statusCode === 200 && Boolean(studentAToken),
      `Issued Student A token with collegeId ${studentALogin.json?.student?.collegeId}`
    );

    // 7. Tenant Boundary: College A Student attempts login to College B
    const studentACrossLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/api/colleges/${collegeMetro._id}/students/login`,
        method: "POST",
      },
      {
        email: `student_${rollA.toLowerCase()}@apextech.edu`,
        password: "StudentPassA123!",
      }
    );
    record(
      "Tenant Boundary: College A student rejected from College B login",
      studentACrossLogin.statusCode === 401,
      `Status: ${studentACrossLogin.statusCode} (Expected 401 Unauthorized)`
    );

    // 8. Super Admin provisions College Admin for College A
    const adminEmailA = `admin_apex_${Date.now()}@apextech.edu`;
    const provisionAdminA = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/api/superadmin/colleges/${collegeApex._id}/admin`,
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      },
      {
        name: "Apex Admin Official",
        email: adminEmailA,
        password: "CollegeAdminPass123!",
      }
    );
    record(
      "Super Admin Provisioning College Admin (/api/superadmin/colleges/:id/admin)",
      provisionAdminA.statusCode === 201,
      `Created College Admin for ${collegeApex.name}`
    );

    // 9. College Admin A Login
    const adminALogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/college-admin/login",
        method: "POST",
      },
      {
        email: adminEmailA,
        password: "CollegeAdminPass123!",
      }
    );
    const collegeAdminAToken = adminALogin.json?.token;
    record(
      "College Admin Login (/api/college-admin/login)",
      adminALogin.statusCode === 200 && Boolean(collegeAdminAToken),
      `Role: ${adminALogin.json?.admin?.role}, College: ${adminALogin.json?.admin?.collegeName}`
    );

    // 10. College Admin A creates College A Notice
    const noticeA = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/college-admin/notices",
        method: "POST",
        headers: {
          Authorization: `Bearer ${collegeAdminAToken}`,
          "Content-Type": "application/json",
        },
      },
      {
        title: "Apex Campus Hackathon 2026",
        content: "Exclusively for Apex Tech students.",
        category: "Events",
      }
    );
    record(
      "College Admin Publishing Notice (/api/college-admin/notices)",
      noticeA.statusCode === 201,
      `Notice ID: ${noticeA.json?.notice?._id}`
    );

    // 11. Super Admin provisions College Admin for College B
    const adminEmailB = `admin_metro_${Date.now()}@metrostate.edu`;
    const provisionAdminB = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: `/api/superadmin/colleges/${collegeMetro._id}/admin`,
        method: "POST",
        headers: { Authorization: `Bearer ${superAdminToken}` },
      },
      {
        name: "Metro Admin Official",
        email: adminEmailB,
        password: "CollegeAdminPass123!",
      }
    );
    const adminBLogin = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/college-admin/login",
        method: "POST",
      },
      {
        email: adminEmailB,
        password: "CollegeAdminPass123!",
      }
    );
    const collegeAdminBToken = adminBLogin.json?.token;

    // College Admin B creates College B Notice
    await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/college-admin/notices",
        method: "POST",
        headers: {
          Authorization: `Bearer ${collegeAdminBToken}`,
          "Content-Type": "application/json",
        },
      },
      {
        title: "Metro State Urban Leadership Forum",
        content: "Exclusively for Metro State University students.",
        category: "Events",
      }
    );

    // 12. Tenant Isolation Verification: Check notices of College A vs College B
    const [noticesColA, noticesColB] = await Promise.all([
      request({
        hostname: "localhost",
        port: 3000,
        path: `/api/colleges/${collegeApex._id}/notices`,
        method: "GET",
      }),
      request({
        hostname: "localhost",
        port: 3000,
        path: `/api/colleges/${collegeMetro._id}/notices`,
        method: "GET",
      }),
    ]);

    const titlesA = (noticesColA.json?.notices || []).map((n) => n.title);
    const titlesB = (noticesColB.json?.notices || []).map((n) => n.title);

    const hasNoticeAInA = titlesA.some((t) => t.includes("Apex Campus Hackathon"));
    const hasNoticeBInB = titlesB.some((t) => t.includes("Metro State Urban"));
    const crossPollution = titlesA.some((t) => t.includes("Metro State Urban")) || titlesB.some((t) => t.includes("Apex Campus Hackathon"));

    record(
      "Tenant Notice Isolation (College A vs College B)",
      hasNoticeAInA && hasNoticeBInB && !crossPollution,
      `Col A has Hackathon: ${hasNoticeAInA}, Col B has Metro Forum: ${hasNoticeBInB}, Cross-pollution: ${crossPollution}`
    );

    // 13. Student Token blocked from Admin route
    const studentBlockedFromAdmin = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/college-admin/notices",
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Malicious Notice Attempt",
        content: "Should be blocked.",
      }),
    });
    record(
      "Authorization Boundary: Student blocked from College Admin route",
      studentBlockedFromAdmin.statusCode === 403,
      `Status: ${studentBlockedFromAdmin.statusCode} (Expected 403 Forbidden)`
    );

    // 14. College Admin Token blocked from Super Admin route
    const adminBlockedFromSuperAdmin = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/superadmin/colleges",
      method: "GET",
      headers: { Authorization: `Bearer ${collegeAdminAToken}` },
    });
    record(
      "Authorization Boundary: College Admin blocked from Super Admin route",
      adminBlockedFromSuperAdmin.statusCode === 403,
      `Status: ${adminBlockedFromSuperAdmin.statusCode} (Expected 403 Forbidden)`
    );

    // 15. Anonymous user blocked from protected routes
    const anonBlocked = await request({
      hostname: "localhost",
      port: 3000,
      path: "/api/college-admin/notices",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Anonymous attempt" }),
    });
    record(
      "Authorization Boundary: Anonymous blocked from protected route",
      anonBlocked.statusCode === 401,
      `Status: ${anonBlocked.statusCode} (Expected 401 Unauthorized)`
    );

    // 16. Chatbot Retrieval Scoping (College A query does not match College B unique knowledge)
    const [chatApex, chatMetro] = await Promise.all([
      request(
        {
          hostname: "localhost",
          port: 3000,
          path: `/api/colleges/${collegeApex._id}/chat/ask`,
          method: "POST",
        },
        { question: "What are the graduation requirements at Metro State University?" }
      ),
      request(
        {
          hostname: "localhost",
          port: 3000,
          path: `/api/colleges/${collegeMetro._id}/chat/ask`,
          method: "POST",
        },
        { question: "What are the graduation requirements at Metro State University?" }
      ),
    ]);

    // Metro chat should answer with graduation requirements (120 credit units)
    // Apex chat should NOT return Metro graduation requirements!
    const metroHasAnswer = (chatMetro.json?.answer || "").includes("120 credit");
    const apexExcludedMetro = !(chatApex.json?.answer || "").includes("120 credit");

    record(
      "Chatbot Tenant Isolation (No cross-college knowledge leakage)",
      metroHasAnswer && apexExcludedMetro,
      `Metro provided Metro answer: ${metroHasAnswer}, Apex excluded Metro knowledge: ${apexExcludedMetro}`
    );

    console.log("\n=== MULTI-COLLEGE AUDIT SUMMARY ===");
    const passedCount = results.filter((r) => r.passed).length;
    console.log(`Passed: ${passedCount}/${results.length}`);
    if (passedCount === results.length) {
      console.log("ALL MULTI-COLLEGE TENANT ISOLATION TESTS PASSED!");
    }
  } catch (err) {
    console.error("Audit test execution error:", err);
  }
}

runAudit();
