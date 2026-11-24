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

  const calculators = { mortgage, capRate, cashOnCash, compound, freelance, vat };

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
