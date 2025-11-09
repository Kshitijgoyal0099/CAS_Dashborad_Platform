// utils/casParser.js

function casParser(casText) {
  // Clean up unnecessary line breaks and page headers
  casText = casText
    .replace(/Page \d+ of \d+.*/g, "")
    .replace(/CAMSCASWS.*/g, "")
    .replace(/Version:.*/g, "")
    .replace(/\n{2,}/g, "\n");

  // --- 1. Personal Details ---
  const personalDetailsMatch = casText.match(
    /Email Id:\s*(.+)\n([\w .-]+)\n([\dA-Z ,/-]+)\n([A-Z]+ - \d{6})\n([A-Za-z]+)\nIndia\nMobile:\s*([\+\d-]+)/
  );
  const personal_details = personalDetailsMatch
    ? {
        name: personalDetailsMatch[2].trim(),
        email: personalDetailsMatch[1].trim(),
        address: `${personalDetailsMatch[3]}, ${personalDetailsMatch[4]}, ${personalDetailsMatch[5]}`.trim(),
        mobile: personalDetailsMatch[6].trim(),
      }
    : {};

  // --- 2. Split sections by AMC ---
  const amcSections = casText.split(/([A-Z ]+ Mutual Fund)/g).filter(Boolean);

  const folios = [];
  for (let i = 0; i < amcSections.length; i++) {
    if (!amcSections[i].includes("Mutual Fund")) continue;
    const fund = amcSections[i].trim();
    const section = amcSections[i + 1] || "";

    // Split folios by "Folio No:"
    const folioSections = section.split(/Folio No[: ]/g).slice(1);

    for (const f of folioSections) {
      const folio_no = f.match(/^([\w\/ -]+)/)?.[1]?.trim() || null;
      const registrar = f.match(/Registrar\s*:\s*([A-Za-z]+)/)?.[1]?.trim() || null;

      // Extract ISIN
      const isin = f.match(/ISIN[: ]([A-Z0-9]+)/)?.[1]?.trim() || null;

      // Scheme name (line before ISIN)
      const schemeMatch = f.match(/([A-Za-z0-9 \-&\/\(\)]+)\s*-?\s*(Direct|Regular)?\s*Plan/i);
      const scheme = schemeMatch ? schemeMatch[1].trim() : "N/A";

      // Advisor or RIA
      const advisorRawMatch = f.match(/Advisor[: ]([A-Z0-9-]+)/i);
      const advisor_raw = advisorRawMatch ? advisorRawMatch[1].trim() : null;
      const advisor_code = advisor_raw && advisor_raw.startsWith("ARN")
        ? advisor_raw
        : null;

      // Determine mode
      let mode = "Unknown";
      if (advisor_code) mode = "Regular";
      else if (/Direct/i.test(f)) mode = "Direct";

      // PAN & KYC
      const pan = f.match(/PAN[: ]([A-Z0-9]+)/)?.[1]?.trim() || null;
      const pan_status = /PAN[: ]([A-Z0-9]+).*(Present|OK)/i.test(f) ? "Present" : null;
      const kyc_status = /KYC[: ](OK|NOT OK)/i.test(f)
        ? f.match(/KYC[: ](OK|NOT OK)/i)[1]
        : null;

      // Transactions
      const financial = [];
      const non_financial = [];

      const lines = f.split("\n").filter(Boolean);

      for (const line of lines) {
        const dateMatch = line.match(/(\d{2}-[A-Za-z]{3}-\d{4})/);
        if (!dateMatch) continue;
        const date = dateMatch[1];

        // Financial transactions
        if (/(Purchase|Redemption|SIP|SWP|STP|Dividend|Switch|Systematic)/i.test(line)) {
          const type = line.match(
            /(Purchase|Redemption|SIP|SWP|STP|Dividend|Switch(?: Out| In)?)/i
          )?.[1] || "Other";

          const amount = line.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g)?.[0] || null;
          const nav = line.match(/(\d+\.\d{3,})/)?.[1] || null;
          const units = line.match(/(\d+\.\d{3,})$/)?.[1] || null;

          financial.push({
            date,
            type,
            details: line.trim(),
            amount: amount ? parseFloat(amount.replace(/,/g, "")) : null,
            nav: nav ? parseFloat(nav) : null,
            units: units ? parseFloat(units) : null,
          });
        }

        // Non-Financial
        else if (
          /\*\*\*.*?(Address|Nominee|KYC|Contact|Cancelled|Consolidation|Transmission|Change|Update|Modification|Termination)/i.test(
            line
          )
        ) {
          const type = line.match(
            /(Address|Nominee|KYC|Contact|Cancelled|Consolidation|Transmission|Update|Modification|Termination)/i
          )?.[1] || "Other";
          non_financial.push({
            date,
            type: type + " Update",
            details: line.trim(),
          });
        }
      }

      // Closing summary
      const closing_units = f.match(/([\d.]+)\s*Units/i)?.[1]
        ? parseFloat(f.match(/([\d.]+)\s*Units/i)[1])
        : null;
      const total_cost = f.match(/Cost Value[: ]([\d.,]+)/)?.[1]
        ? parseFloat(f.match(/Cost Value[: ]([\d.,]+)/)[1].replace(/,/g, ""))
        : null;
      const nav = f.match(/NAV[: ]([\d.]+)/)?.[1]
        ? parseFloat(f.match(/NAV[: ]([\d.]+)/)[1])
        : null;
      const market_value = f.match(/Market Value[: ]([\d.,]+)/)?.[1]
        ? parseFloat(f.match(/Market Value[: ]([\d.,]+)/)[1].replace(/,/g, ""))
        : null;

      folios.push({
        fund,
        folio_no,
        scheme,
        isin,
        registrar,
        mode,
        advisor_code,
        advisor_raw,
        pan,
        pan_status,
        kyc_status,
        transactions: { financial, non_financial },
        closing_units,
        total_cost,
        nav,
        market_value,
      });
    }
  }

  return {
    personal_details,
    portfolio_summary: [],
    folios,
  };
}

module.exports = casParser;
