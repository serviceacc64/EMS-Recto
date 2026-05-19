export const DEPARTMENT_OPTIONS = {
  "Junior High": [
    "ENGLISH",
    "FILIPINO",
    "MATHEMATICS",
    "SCIENCE",
    "ARALING PANLIPUNAN",
    "MAPEH",
    "ESP",
    "TLE",
    "UNDEFINED",
    "ADMINISTRATIVE"
  ],
  "Senior High": [
    "HUMMS",
    "ARTS & DESIGN",
    "STEM",
    "ABM",
    "TECH",
    "UNDEFINED",
    "ADMINISTRATIVE"
  ]
};

export const toSnakeCase = (obj) => {
  if (!obj) return obj;
  const newObj = {};
  const dateAndNumericFields = [
    "birthdate",
    "original_appointment_date",
    "last_promotion_date",
    "prc_expiration",
    "local_leave_balance",
    "do_leave_balance"
  ];

  for (const key in obj) {
    if (key === "id") {
      newObj[key] = obj[key];
      continue;
    }
    const snakeKey = key.replace(
      /[A-Z]/g,
      (letter) => "_" + letter.toLowerCase(),
    );
    // Convert empty strings to null only for date/numeric columns to prevent invalid input syntax
    // while keeping empty strings for text fields to avoid violating NOT NULL constraints.
    if (dateAndNumericFields.includes(snakeKey)) {
      newObj[snakeKey] = obj[key] === "" ? null : obj[key];
    } else {
      newObj[snakeKey] = obj[key];
    }
  }
  return newObj;
};

export const toCamelCase = (obj) => {
  if (!obj) return obj;
  const newObj = {};
  for (const key in obj) {
    if (key === "id") {
      newObj[key] = obj[key];
      continue;
    }
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    newObj[camelKey] = obj[key];
  }
  return newObj;
};

export const romanToInt = (roman) => {
  const map = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
    VIII: 8,
    IX: 9,
    X: 10,
  };
  return map[roman] || 0;
};

export const getSortValue = (emp, key) => {
  if (key === "position" && emp.position) {
    const match = emp.position.match(
      /(.*?)\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)$/i,
    );

    let base = emp.position.trim().toUpperCase();
    let rankNum = 0;

    if (match) {
      base = match[1].trim().toUpperCase();
      rankNum = romanToInt(match[2].toUpperCase());
    }

    // Rank mapping (lower number = higher rank)
    const hierarchy = {
      PRINCIPAL: "10",
      "MASTER TEACHER": "20",
      TEACHER: "30",
      "ADMINISTRATIVE ASSISTANT": "40",
    };

    const weight = hierarchy[base] || "99";

    // Invert rankNum so III (3) comes before I (1) when ascending
    const invertedRank = String(99 - rankNum).padStart(2, "0");

    return `${weight}-${invertedRank}-${base}`;
  }

  if (typeof emp[key] === "string") {
    return emp[key].toUpperCase();
  }

  return emp[key] || "";
};
