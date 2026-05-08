import { buildDistributionChart, buildEtrChart, buildIndexedChart } from "./charts.js";
import { loadAssessmentCalendar, loadPropertyData } from "./data-service.js";
import { initImageModal } from "./modal.js";
import { renderPage } from "./render.js";

async function main() {
  const [data, calendar] = await Promise.all([loadPropertyData(), loadAssessmentCalendar()]);
  const imageModal = initImageModal(data.assets);

  renderPage(data, imageModal, calendar);
  buildIndexedChart(data);
  buildEtrChart(data);
  buildDistributionChart(data);
}

main().catch(error => {
  console.error(error);
  document.body.innerHTML = `
    <main class="mx-auto max-w-2xl p-6">
      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-red-200">
        <h1 class="text-xl font-bold text-red-700">Property snapshot could not load</h1>
        <p class="mt-2 text-sm text-slate-700">${error.message}</p>
      </section>
    </main>
  `;
});
