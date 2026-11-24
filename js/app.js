(function () {
  const money = (n) => {
    if (!isFinite(n)) return "—";
    const abs = Math.abs(n);
    const opts = { minimumFractionDigits: 2, maximumFractionDigits: 2 };
    if (abs >= 1e9 || (abs > 0 && abs < 0.005)) {
      return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return n.toLocaleString(undefined, opts);
  };
  const pct = (n) => (isFinite(n) ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) + "%" : "—");
  const num = (form, name) => {
    const raw = form.elements[name].value;
    const v = parseFloat(raw);
    return raw === "" || Number.isNaN(v) ? null : v;
  };
  const show = (root, html) => {
    const box = root.querySelector("[data-results]");
    box.innerHTML = html;
  };
  const stat = (label, value) =>
    `<div class="stat"><span>${label}</span><strong>${value}</strong></div>`;

  function mortgage(form, root) {
    const P = num(form, "principal");
    const annual = num(form, "rate");
    const years = num(form, "years");
    if (P === null || annual === null || years === null || P < 0 || annual < 0 || years <= 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter a loan amount, a rate of 0 or more, and a term longer than 0 years.</p>`);
      return;
    }
    const n = Math.round(years * 12);
    const r = annual / 100 / 12;
    const payment = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = payment * n;
    const interest = total - P;
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(payment)}</p>
      <p class="unit">estimated monthly principal &amp; interest</p>
      <div class="stats">
        ${stat("Payments", n.toLocaleString() + " months")}
        ${stat("Total paid", money(total))}
        ${stat("Total interest", money(interest))}
      </div>
      <p class="fine">Taxes, insurance, and fees are not included. This is a standard fixed-rate amortization.</p>`);
  }

  function capRate(form, root) {
    const income = num(form, "income");
    const expenses = num(form, "expenses");
    const value = num(form, "value");
    if (income === null || expenses === null || value === null || value <= 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter income, expenses, and a property value greater than 0.</p>`);
      return;
    }
    const noi = income - expenses;
    const cap = (noi / value) * 100;
    const warn = noi <= 0 ? `<p class="warn">NOI is zero or negative, so the cap rate is not a useful buy signal.</p>` : "";
    show(root, `
      <h2>Results</h2>
      <p class="big">${pct(cap)}</p>
      <p class="unit">capitalization rate</p>
      <div class="stats">
        ${stat("Net operating income", money(noi))}
        ${stat("Value used", money(value))}
      </div>
      ${warn}
      <p class="fine">Cap rate uses NOI only. Do not subtract mortgage payments here.</p>`);
  }

  function cashOnCash(form, root) {
    const noi = num(form, "noi");
    const debt = num(form, "debt");
    const cash = num(form, "cash");
    if (noi === null || debt === null || cash === null || cash <= 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter NOI, annual debt service, and cash invested greater than 0.</p>`);
      return;
    }
    const flow = noi - debt;
    const coc = (flow / cash) * 100;
    show(root, `
      <h2>Results</h2>
      <p class="big">${pct(coc)}</p>
      <p class="unit">cash-on-cash return</p>
      <div class="stats">
        ${stat("Annual pre-tax cash flow", money(flow))}
        ${stat("Cash invested", money(cash))}
      </div>
      <p class="fine">A positive number means the property is producing cash after debt service, before tax.</p>`);
  }

  function compound(form, root) {
    const P = num(form, "principal");
    const annual = num(form, "rate");
    const years = num(form, "years");
    const pmt = num(form, "contribution") ?? 0;
    const freq = parseInt(form.elements.frequency.value, 10);
    if (P === null || annual === null || years === null || P < 0 || annual < 0 || years < 0 || pmt < 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter a starting amount, rate, and time of 0 or more. Contributions can be 0.</p>`);
      return;
    }
    const n = freq;
    const t = years;
    const i = annual / 100 / n;
    const periods = n * t;
    let fv;
    if (i === 0) {
      fv = P + pmt * periods;
    } else {
      fv = P * Math.pow(1 + i, periods) + pmt * ((Math.pow(1 + i, periods) - 1) / i);
    }
    const contributed = P + pmt * periods;
    const interest = fv - contributed;
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(fv)}</p>
      <p class="unit">future value (contributions at period end)</p>
      <div class="stats">
        ${stat("Total contributed", money(contributed))}
        ${stat("Interest earned", money(interest))}
        ${stat("Compounding periods", periods.toLocaleString())}
      </div>`);
  }

  function freelance(form, root) {
    const income = num(form, "income");
    const expenses = num(form, "expenses") ?? 0;
    const weeks = num(form, "weeks");
    const hours = num(form, "hours");
    const buffer = num(form, "buffer") ?? 0;
    if (income === null || weeks === null || hours === null || weeks <= 0 || hours <= 0 || income < 0 || expenses < 0 || buffer < 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter a target income, billable weeks, and hours per week greater than 0.</p>`);
      return;
    }
    const needed = (income + expenses) * (1 + buffer / 100);
    const billable = weeks * hours;
    const hourly = needed / billable;
    const daily = hourly * 8;
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(hourly)}</p>
      <p class="unit">minimum billable hourly rate</p>
      <div class="stats">
        ${stat("8-hour day rate", money(daily))}
        ${stat("Weekly rate", money(hourly * hours))}
        ${stat("Billable hours / year", billable.toLocaleString())}
        ${stat("Amount to cover", money(needed))}
      </div>
      <p class="fine">The buffer lifts the rate so tax, unpaid admin, and downtime are not eaten out of take-home pay.</p>`);
  }

  function vat(form, root) {
    const amount = num(form, "amount");
    const rate = num(form, "rate");
    const mode = form.elements.mode.value;
    if (amount === null || rate === null || amount < 0 || rate < 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter an amount and a VAT rate of 0 or more.</p>`);
      return;
    }
    let net, gross, tax;
    if (mode === "add") {
      net = amount;
      tax = net * (rate / 100);
      gross = net + tax;
    } else {
      gross = amount;
      net = gross / (1 + rate / 100);
      tax = gross - net;
    }
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(mode === "add" ? gross : net)}</p>
      <p class="unit">${mode === "add" ? "amount including VAT" : "amount excluding VAT"}</p>
      <div class="stats">
        ${stat("Net (ex-VAT)", money(net))}
        ${stat("VAT amount", money(tax))}
        ${stat("Gross (inc-VAT)", money(gross))}
        ${stat("Rate used", pct(rate))}
      </div>
      <p class="fine">Rates change. Confirm the current rate with your tax authority before invoicing.</p>`);
  }


  function emi(form, root) {
    const P = num(form, "principal");
    const annual = num(form, "rate");
    const months = num(form, "months");
    if (P === null || annual === null || months === null || P < 0 || annual < 0 || months < 1) {
      show(root, `<h2>Results</h2><p class="warn">Enter a loan amount, a rate of 0 or more, and a tenure of at least 1 month.</p>`);
      return;
    }
    const n = Math.round(months);
    const r = annual / 100 / 12;
    const payment = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const total = payment * n;
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(payment)}</p>
      <p class="unit">equated monthly installment (EMI)</p>
      <div class="stats">
        ${stat("Tenure", n.toLocaleString() + " months")}
        ${stat("Total paid", money(total))}
        ${stat("Total interest", money(total - P))}
      </div>`);
  }

  function salaryHourly(form, root) {
    const salary = num(form, "salary");
    const weeks = num(form, "weeks");
    const hours = num(form, "hours");
    if (salary === null || weeks === null || hours === null || salary < 0 || weeks <= 0 || hours <= 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter a salary and weeks and hours greater than 0.</p>`);
      return;
    }
    const yearlyHours = weeks * hours;
    const hourly = salary / yearlyHours;
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(hourly)}</p>
      <p class="unit">hourly equivalent</p>
      <div class="stats">
        ${stat("Daily (5-day week)", money((hourly * hours) / 5))}
        ${stat("Weekly", money(hourly * hours))}
        ${stat("Monthly (salary ÷ 12)", money(salary / 12))}
        ${stat("Hours / year", yearlyHours.toLocaleString())}
      </div>
      <p class="fine">A common full-time baseline is 40 hours × 52 weeks = 2,080 hours.</p>`);
  }

  function inflation(form, root) {
    const amount = num(form, "amount");
    const rate = num(form, "rate");
    const years = num(form, "years");
    if (amount === null || rate === null || years === null || amount < 0 || years < 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter an amount, an inflation rate, and a time of 0 years or more.</p>`);
      return;
    }
    const factor = Math.pow(1 + rate / 100, years);
    const future = amount * factor;
    const power = rate === -100 ? NaN : amount / factor;
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(future)}</p>
      <p class="unit">future cost of the same basket</p>
      <div class="stats">
        ${stat("Purchasing power of " + money(amount) + " after " + years + " years", money(power))}
        ${stat("Cumulative change", pct((factor - 1) * 100))}
        ${stat("Multiplier", isFinite(factor) ? factor.toLocaleString(undefined, { maximumFractionDigits: 4 }) : "—")}
      </div>`);
  }

  function fire(form, root) {
    const spend = num(form, "spend");
    const swr = num(form, "swr");
    const savings = num(form, "savings");
    const contrib = num(form, "contrib");
    const ret = num(form, "return");
    if (spend === null || swr === null || savings === null || contrib === null || ret === null || spend < 0 || swr <= 0 || savings < 0 || contrib < 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter spending, a withdrawal rate above 0, current savings, monthly saving, and an expected return.</p>`);
      return;
    }
    const target = spend / (swr / 100);
    const r = ret / 100 / 12;
    let months = null;
    let note = "";
    if (savings >= target) {
      months = 0;
    } else if (r === 0) {
      if (contrib <= 0) note = `<p class="warn">With a 0% return and no contributions, the target is not reached.</p>`;
      else months = Math.ceil((target - savings) / contrib);
    } else {
      const denom = savings + contrib / r;
      const numer = target + contrib / r;
      if (denom <= 0 || numer / denom <= 0) {
        note = `<p class="warn">With these inputs the portfolio does not grow to the FIRE number.</p>`;
      } else {
        months = Math.ceil(Math.log(numer / denom) / Math.log(1 + r));
        if (months < 0) note = `<p class="warn">With these inputs the portfolio does not grow to the FIRE number.</p>`;
      }
    }
    const years = months !== null && months >= 0 && !note ? months / 12 : null;
    const reached = years !== null ? (years < 1 ? months + " months" : years.toLocaleString(undefined, { maximumFractionDigits: 1 }) + " years") : "Not reached";
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(target)}</p>
      <p class="unit">FIRE number (annual spend ÷ withdrawal rate)</p>
      <div class="stats">
        ${stat("Time to FIRE", reached)}
        ${stat("Current savings", money(savings))}
        ${stat("Monthly contribution", money(contrib))}
      </div>
      ${note}
      <p class="fine">This uses the constant withdrawal-rate rule and monthly compounding. It ignores taxes and sequence-of-returns risk.</p>`);
  }

  function rentVsBuy(form, root) {
    const price = num(form, "price");
    const downPct = num(form, "down");
    const rate = num(form, "rate");
    const term = num(form, "term");
    const rent = num(form, "rent");
    const taxPct = num(form, "tax");
    const insurance = num(form, "insurance");
    const maintPct = num(form, "maint");
    const appr = num(form, "appr");
    const years = num(form, "years");
    const rentInfl = num(form, "rentInfl");
    const closingPct = num(form, "closing");
    const sellingPct = num(form, "selling");
    const vals = [price, downPct, rate, term, rent, taxPct, insurance, maintPct, appr, years, rentInfl, closingPct, sellingPct];
    if (vals.some((v) => v === null) || price <= 0 || years < 1 || term <= 0 || rent < 0) {
      show(root, `<h2>Results</h2><p class="warn">Fill every field. Price, term, and years must be greater than 0.</p>`);
      return;
    }
    const down = price * (downPct / 100);
    const closing = price * (closingPct / 100);
    const loan0 = Math.max(price - down, 0);
    const nLoan = Math.round(term * 12);
    const r = rate / 100 / 12;
    const mPay = loan0 === 0 ? 0 : r === 0 ? loan0 / nLoan : (loan0 * r * Math.pow(1 + r, nLoan)) / (Math.pow(1 + r, nLoan) - 1);
    const months = Math.round(years * 12);
    let bal = loan0;
    let rentPaid = 0;
    let ownCarry = 0;
    let currentRent = rent;
    for (let m = 1; m <= months; m++) {
      rentPaid += currentRent;
      if (m % 12 === 0) currentRent *= 1 + rentInfl / 100;
      const interest = r === 0 ? 0 : bal * r;
      const principal = bal > 0 ? Math.min(mPay - interest, bal) : 0;
      if (bal > 0) {
        ownCarry += mPay;
        bal = Math.max(bal - principal, 0);
      }
      ownCarry += (price * (taxPct / 100) + insurance + price * (maintPct / 100)) / 12;
    }
    const homeValue = price * Math.pow(1 + appr / 100, years);
    const selling = homeValue * (sellingPct / 100);
    const equity = homeValue - bal - selling;
    const buyCash = down + closing + ownCarry;
    const buyNet = buyCash - equity;
    const winner = buyNet < rentPaid ? "Buying has the lower net cost over this period." : buyNet > rentPaid ? "Renting has the lower net cost over this period." : "The net costs are about even.";
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(Math.abs(rentPaid - buyNet))}</p>
      <p class="unit">gap in net cost over ${years} years</p>
      <div class="stats">
        ${stat("Monthly mortgage P&amp;I", money(mPay))}
        ${stat("Total rent paid", money(rentPaid))}
        ${stat("Cash spent to buy &amp; hold", money(buyCash))}
        ${stat("Equity after selling costs", money(equity))}
        ${stat("Net cost of buying", money(buyNet))}
      </div>
      <p>${winner}</p>
      <p class="fine">Net cost of buying is cash out minus remaining equity after selling costs. It ignores tax deductions and the return you might have earned by investing the down payment.</p>`);
  }

  function percentage(form, root) {
    const mode = form.elements.mode.value;
    const a = num(form, "a");
    const b = num(form, "b");
    if (a === null || b === null) {
      show(root, `<h2>Results</h2><p class="warn">Enter both numbers.</p>`);
      return;
    }
    let heading = "";
    let value = NaN;
    let extra = "";
    if (mode === "percentOf") {
      value = (a / 100) * b;
      heading = a + "% of " + b;
      extra = stat("Result", money(value));
    } else if (mode === "isWhat") {
      if (b === 0) {
        show(root, `<h2>Results</h2><p class="warn">Cannot divide by zero. The second number must not be 0.</p>`);
        return;
      }
      value = (a / b) * 100;
      heading = a + " is this percent of " + b;
      extra = stat("Percent", pct(value));
    } else if (mode === "change") {
      if (a === 0) {
        show(root, `<h2>Results</h2><p class="warn">Percentage change is undefined when the starting number is 0.</p>`);
        return;
      }
      value = ((b - a) / Math.abs(a)) * 100;
      heading = "Change from " + a + " to " + b;
      extra = stat("Percentage change", pct(value)) + stat("Difference", money(b - a));
    } else if (mode === "increase") {
      value = b * (1 + a / 100);
      heading = b + " increased by " + a + "%";
      extra = stat("New amount", money(value)) + stat("Increase", money(value - b));
    } else {
      value = b * (1 - a / 100);
      heading = b + " decreased by " + a + "%";
      extra = stat("New amount", money(value)) + stat("Decrease", money(b - value));
    }
    show(root, `
      <h2>Results</h2>
      <p class="big">${mode === "isWhat" || mode === "change" ? pct(value) : money(value)}</p>
      <p class="unit">${heading}</p>
      <div class="stats">${extra}</div>`);
  }


  function israelNet(form, root) {
    const gross = num(form, "gross");
    const points = num(form, "points");
    const pointValue = num(form, "pointValue");
    const other = num(form, "other") ?? 0;
    if (gross === null || points === null || pointValue === null || gross < 0 || points < 0 || pointValue < 0 || other < 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter a monthly gross salary of 0 or more, credit points, and the credit-point value.</p>`);
      return;
    }
    const brackets = [
      [7010, 0.10],
      [10060, 0.14],
      [19000, 0.20],
      [25100, 0.31],
      [46690, 0.35],
      [Infinity, 0.47]
    ];
    let tax = 0, prev = 0;
    for (const [cap, rate] of brackets) {
      if (gross <= prev) break;
      tax += (Math.min(gross, cap) - prev) * rate;
      prev = cap;
    }
    const credits = points * pointValue;
    const taxAfter = Math.max(0, tax - credits);
    const niMax = 51910, niBand = 7703;
    const niBase = Math.min(gross, niMax);
    const low = Math.min(niBase, niBand);
    const high = Math.max(niBase - niBand, 0);
    const ni = low * 0.0104 + high * 0.07;
    const health = low * 0.0323 + high * 0.0517;
    const net = gross - taxAfter - ni - health - other;
    const effective = gross > 0 ? ((gross - net) / gross) * 100 : 0;
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(net)}</p>
      <p class="unit">estimated monthly net, in ₪</p>
      <div class="stats">
        ${stat("Income tax after credits", money(taxAfter))}
        ${stat("Tax before credits", money(tax))}
        ${stat("Credit used", money(Math.min(credits, tax)))}
        ${stat("National Insurance (employee)", money(ni))}
        ${stat("Health insurance (employee)", money(health))}
        ${stat("Other deductions", money(other))}
        ${stat("Effective deduction rate", pct(effective))}
      </div>
      <p class="fine">Uses ITA 2026 monthly work-income brackets (booklet updated April 2026) and BTL employee rates as of 1 January 2026. It does not model pension tax relief, travel, union dues, or special credit points. Confirm with the ITA and BTL before you rely on the figure.</p>`);
  }

  function arnona(form, root) {
    const area = num(form, "area");
    const rate = num(form, "rate");
    const months = num(form, "months");
    if (area === null || rate === null || months === null || area < 0 || rate < 0 || months < 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter floor area, a rate per square metre, and a number of months of 0 or more.</p>`);
      return;
    }
    const annual = area * rate;
    const period = annual * (months / 12);
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(period)}</p>
      <p class="unit">arnona for ${months.toLocaleString()} month${months === 1 ? "" : "s"}</p>
      <div class="stats">
        ${stat("Annual bill at this rate", money(annual))}
        ${stat("Average monthly", money(annual / 12))}
        ${stat("Area × rate", money(area) + " × " + money(rate))}
      </div>
      <p class="fine">Rates are set by each city, zone, and property use, and often change each year. Enter the ₪ per m² figure from your municipality, not a national average.</p>`);
  }

  function masShevach(form, root) {
    const sale = num(form, "sale");
    const purchase = num(form, "purchase");
    const costs = num(form, "costs") ?? 0;
    const inflation = num(form, "inflation") ?? 0;
    const rate = num(form, "rate");
    if (sale === null || purchase === null || rate === null || sale < 0 || purchase < 0 || costs < 0 || inflation < 0 || rate < 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter sale price, purchase price, and a tax rate of 0 or more. Costs and inflation adjustment can be 0.</p>`);
      return;
    }
    const nominal = sale - purchase - costs;
    const taxable = Math.max(sale - purchase - costs - inflation, 0);
    const tax = taxable * (rate / 100);
    const warn = nominal <= 0 ? `<p class="warn">There is no nominal gain on these numbers, so estimated tax is zero.</p>` : "";
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(tax)}</p>
      <p class="unit">estimated mas shevach (betterment tax)</p>
      <div class="stats">
        ${stat("Nominal gain (sale − purchase − costs)", money(nominal))}
        ${stat("Inflation adjustment entered", money(inflation))}
        ${stat("Estimated taxable gain", money(taxable))}
        ${stat("Rate used", pct(rate))}
      </div>
      ${warn}
      <p class="fine">This is a teaching estimate only. Residence exemptions, the linear exemption, inflation indexation rules, and corporate rates can change the real bill to zero or to a different figure. Check the ITA or a tax adviser.</p>`);
  }

  function tip(form, root) {
    const bill = num(form, "bill");
    const tipPct = num(form, "tip");
    const people = num(form, "people");
    if (bill === null || tipPct === null || people === null || bill < 0 || tipPct < 0 || people < 1) {
      show(root, `<h2>Results</h2><p class="warn">Enter a bill of 0 or more, a tip percent, and at least one person.</p>`);
      return;
    }
    const tipAmt = bill * (tipPct / 100);
    const total = bill + tipAmt;
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(total)}</p>
      <p class="unit">bill plus tip</p>
      <div class="stats">
        ${stat("Tip amount", money(tipAmt))}
        ${stat("Per person", money(total / people))}
        ${stat("Tip per person", money(tipAmt / people))}
      </div>`);
  }

  function unitPrice(form, root) {
    const priceA = num(form, "priceA");
    const qtyA = num(form, "qtyA");
    const priceB = num(form, "priceB");
    const qtyB = num(form, "qtyB");
    if (priceA === null || qtyA === null || priceA < 0 || qtyA <= 0) {
      show(root, `<h2>Results</h2><p class="warn">Enter a price and a quantity greater than 0 for item A. Item B is optional.</p>`);
      return;
    }
    const unitA = priceA / qtyA;
    const hasB = priceB !== null && qtyB !== null;
    if (hasB && (priceB < 0 || qtyB <= 0)) {
      show(root, `<h2>Results</h2><p class="warn">If you compare a second item, its quantity must be greater than 0.</p>`);
      return;
    }
    const unitB = hasB ? priceB / qtyB : null;
    let compare = "";
    if (unitB !== null) {
      const better = unitA < unitB ? "Item A is cheaper per unit." : unitA > unitB ? "Item B is cheaper per unit." : "The unit prices are the same.";
      compare = `${stat("Item B unit price", money(unitB))}${stat("Difference (A − B)", money(unitA - unitB))}<p>${better}</p>`;
    }
    show(root, `
      <h2>Results</h2>
      <p class="big">${money(unitA)}</p>
      <p class="unit">unit price for item A (price ÷ quantity)</p>
      <div class="stats">
        ${stat("Item A unit price", money(unitA))}
        ${compare}
      </div>
      <p class="fine">Use the same unit for both quantities (for example grams, ounces, or litres).</p>`);
  }

  function dateDiff(form, root) {
    const start = form.elements.start.value;
    const end = form.elements.end.value;
    const inclusive = form.elements.inclusive && form.elements.inclusive.checked;
    if (!start || !end) {
      show(root, `<h2>Results</h2><p class="warn">Choose a start date and an end date.</p>`);
      return;
    }
    const parse = (s) => {
      const [y, m, d] = s.split("-").map(Number);
      return Date.UTC(y, m - 1, d);
    };
    let a = parse(start), b = parse(end);
    const swapped = b < a;
    if (swapped) { const tmp = a; a = b; b = tmp; }
    let days = Math.round((b - a) / 86400000);
    if (inclusive) days += 1;
    const weeks = days / 7;
    show(root, `
      <h2>Results</h2>
      <p class="big">${days.toLocaleString()}</p>
      <p class="unit">day${days === 1 ? "" : "s"} ${inclusive ? "(inclusive of both dates)" : "between the dates"}</p>
      <div class="stats">
        ${stat("Whole weeks", Math.floor(weeks).toLocaleString())}
        ${stat("Weeks (decimal)", weeks.toLocaleString(undefined, { maximumFractionDigits: 2 }))}
        ${stat("Hours (24-hour days)", (days * 24).toLocaleString())}
      </div>
      ${swapped ? `<p class="fine">The end date was earlier than the start date, so the gap is measured in reverse.</p>` : ""}`);
  }

  const calculators = { mortgage, capRate, cashOnCash, compound, freelance, vat, emi, salaryHourly, inflation, fire, rentVsBuy, percentage, israelNet, arnona, masShevach, tip, unitPrice, dateDiff };

  function bind(root) {
    const kind = root.getAttribute("data-calc");
    const fn = calculators[kind];
    const form = root.querySelector("form");
    if (!fn || !form) return;
    const run = () => fn(form, root);
    form.addEventListener("input", run);
    form.addEventListener("submit", (e) => { e.preventDefault(); run(); });
    root.querySelectorAll("[data-rate]").forEach((btn) => {
      btn.addEventListener("click", () => {
        form.elements.rate.value = btn.getAttribute("data-rate");
        root.querySelectorAll("[data-rate]").forEach((b) => b.setAttribute("aria-pressed", b === btn ? "true" : "false"));
        run();
      });
    });
    run();
  }

  document.querySelectorAll("[data-calc]").forEach(bind);
})();
