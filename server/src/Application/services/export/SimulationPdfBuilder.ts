// ============================================================
// SimulationPdfBuilder — HU-40
// Genera un Buffer PDF usando pdfkit.
// Paleta: blanco y negro formal estilo recibo UPB.
// Logo real LogoUpb.png en cabecera (escala de grises).
// Tabla de amortización paginada con cabecera repetida.
// Pie chart Capital vs Intereses dibujado a mano.
// ============================================================

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import type { PersistedSimulationWithUser } from '../../../Core/repositories/ISimulationRepository';

// ── Colores B&N formales ──────────────────────────────────────
const BLACK      = '#000000';
const NEAR_BLACK = '#1a1a1a';   // títulos principales
const DARK_GRAY  = '#333333';   // subtítulos, etiquetas cabecera
const MID_GRAY   = '#555555';   // texto secundario, etiquetas campo
const LIGHT_GRAY = '#888888';   // texto terciario, notas
const RULE_GRAY  = '#bbbbbb';   // líneas de borde internas
const ROW_ALT    = '#f5f5f5';   // fondo fila alternada
const WHITE      = '#ffffff';

// ── Ruta al logo (copiado junto a este archivo) ───────────────
const LOGO_PATH = path.join(__dirname, 'logo-upb.png');

// ── Helpers ───────────────────────────────────────────────────

function cop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' COP';
}

function fmtDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const raw = new Intl.DateTimeFormat('es-CO', { month: 'short', year: 'numeric' }).format(d);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function fmtDateLong(date: Date): string {
  return date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

function levelLabel(level: string): string {
  const map: Record<string, string> = { PREGRADO: 'Pregrado', POSGRADO: 'Posgrado', UPB_TEC: 'UPB Tec' };
  return map[level] ?? level;
}

// Dibuja segmento de pastel (polígono, evita dependencia de .arc())
function drawPieSlice(
  doc: PDFKit.PDFDocument,
  cx: number, cy: number, r: number,
  startDeg: number, endDeg: number,
  color: string,
): void {
  const steps = 72;
  const sDeg  = startDeg;
  const eDeg  = endDeg > startDeg ? endDeg : endDeg + 360;
  const step  = (eDeg - sDeg) / steps;
  const toRad = (d: number) => (d * Math.PI) / 180;
  doc.save().fillColor(color).moveTo(cx, cy);
  for (let i = 0; i <= steps; i++) {
    const a = toRad(sDeg + i * step);
    doc.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
  }
  doc.lineTo(cx, cy).fill().restore();
}

// ── Builder principal ──────────────────────────────────────────

export function buildSimulationPdf(sim: PersistedSimulationWithUser): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 45, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end',  ()         => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const s   = sim.summary;
    const stu = sim.student;
    const ML  = 45;
    const MR  = 45;
    const PW  = doc.page.width - ML - MR;   // ~505 pt en A4
    const PAGE_H = doc.page.height - 55;    // margen inferior útil
    const now = new Date();

    // ── Carga logo (silencia error si no existe) ───────────────
    let logoBuffer: Buffer | null = null;
    try { logoBuffer = fs.readFileSync(LOGO_PATH); } catch { logoBuffer = null; }

    // ══════════════════════════════════════════════════════════
    // CABECERA PÁGINA 1
    // ══════════════════════════════════════════════════════════

    // Logo izquierda (imagen real en escala de grises visual)
    if (logoBuffer) {
      doc.image(logoBuffer, ML, 32, { width: 100 });
    } else {
      // fallback textual si no existe el archivo
      doc.fontSize(20).fillColor(NEAR_BLACK).font('Helvetica-Bold').text('UPB', ML, 36);
      doc.fontSize(7).fillColor(LIGHT_GRAY).font('Helvetica')
         .text('Universidad Pontificia Bolivariana', ML, 58);
    }

    // Título derecha
    const titleX = ML + PW - 220;
    doc.fontSize(9).fillColor(NEAR_BLACK).font('Helvetica-Bold')
       .text('SIMULADOR DE CRÉDITO EDUCATIVO', titleX, 34, { width: 220, align: 'right' });
    doc.fontSize(8).fillColor(DARK_GRAY).font('Helvetica-Bold')
       .text('Reporte de Simulación', titleX, 46, { width: 220, align: 'right' });
    doc.fontSize(7.5).fillColor(MID_GRAY).font('Helvetica')
       .text(`Fecha emisión: ${fmtDateLong(now)}`, titleX, 58, { width: 220, align: 'right' });

    // Línea separadora gruesa cabecera
    const lineY = 76;
    doc.moveTo(ML, lineY).lineTo(ML + PW, lineY)
       .strokeColor(BLACK).lineWidth(1.5).stroke();

    let y = lineY + 8;

    // ══════════════════════════════════════════════════════════
    // Helpers de layout — definidos dentro del closure para
    // acceder a `y`, `doc`, `ML`, `PW` por referencia/closure.
    // ══════════════════════════════════════════════════════════

    /** Cabecera de sección: fondo negro, texto blanco */
    function sectionHeader(title: string): void {
      doc.rect(ML, y, PW, 18).fill(NEAR_BLACK);
      doc.fontSize(8.5).fillColor(WHITE).font('Helvetica-Bold')
         .text(title.toUpperCase(), ML + 7, y + 4, { width: PW - 14 });
      // Borde exterior
      doc.rect(ML, y, PW, 18).stroke(BLACK);
      y += 18;
    }

    /** Fila de 2 celdas con borde */
    function row2(
      lbl1: string, val1: string,
      lbl2: string, val2: string,
      altBg = false,
    ): void {
      const half = PW / 2;
      const rh   = 26;
      const bg   = altBg ? ROW_ALT : WHITE;

      // Fondos
      doc.rect(ML,        y, half, rh).fill(bg);
      doc.rect(ML + half, y, half, rh).fill(bg);
      // Bordes exteriores
      doc.rect(ML, y, PW, rh).stroke(RULE_GRAY);
      // Divisor central
      doc.moveTo(ML + half, y).lineTo(ML + half, y + rh)
         .strokeColor(RULE_GRAY).lineWidth(0.5).stroke();

      // Etiqueta superior
      doc.fontSize(6.5).fillColor(MID_GRAY).font('Helvetica-Bold')
         .text(lbl1.toUpperCase(), ML + 5, y + 3, { width: half - 10 })
         .text(lbl2.toUpperCase(), ML + half + 5, y + 3, { width: half - 10 });
      // Valor inferior
      doc.fontSize(8.5).fillColor(NEAR_BLACK).font('Helvetica')
         .text(val1, ML + 5, y + 13, { width: half - 10 })
         .text(val2, ML + half + 5, y + 13, { width: half - 10 });
      y += rh;
    }

    /** Fila de 1 celda con borde */
    function row1(lbl: string, val: string, altBg = false): void {
      const rh = 26;
      doc.rect(ML, y, PW, rh).fill(altBg ? ROW_ALT : WHITE);
      doc.rect(ML, y, PW, rh).stroke(RULE_GRAY);
      doc.fontSize(6.5).fillColor(MID_GRAY).font('Helvetica-Bold')
         .text(lbl.toUpperCase(), ML + 5, y + 3, { width: PW - 10 });
      doc.fontSize(8.5).fillColor(NEAR_BLACK).font('Helvetica')
         .text(val, ML + 5, y + 13, { width: PW - 10 });
      y += rh;
    }

    /** Añade nueva página con mini-cabecera de continuación */
    function newPage(): void {
      doc.addPage();
      // Mini-cabecera en continuación
      doc.fontSize(7).fillColor(LIGHT_GRAY).font('Helvetica')
         .text('Simulador de Crédito Educativo — UPB', ML, 28, { align: 'left' })
         .text(`Generado: ${now.toLocaleString('es-CO')}`, ML, 28, { align: 'right', width: PW });
      doc.moveTo(ML, 40).lineTo(ML + PW, 40)
         .strokeColor(RULE_GRAY).lineWidth(0.5).stroke();
      y = 50;
    }

    // ══════════════════════════════════════════════════════════
    // SECCIÓN 1: Datos del Estudiante
    // ══════════════════════════════════════════════════════════
    sectionHeader('1. Datos del Estudiante');

    row2('Nombre Completo', `${stu.firstName} ${stu.lastName}`, 'Correo Electrónico', stu.email);
    row2('Tipo de Documento', stu.documentType || '—', 'N° Identificación', stu.identificationNumber, true);
    row2('Número de Celular', stu.phone || 'No registrado', 'Nivel Educativo', levelLabel(sim.level));
    row2(
      'Tipo de Estudiante', sim.studentType === 'NUEVO' ? 'Nuevo' : 'Continuo',
      'Modalidad', s.interestMode === 'con_interes' ? 'Con Intereses' : 'Sin Intereses',
      true,
    );
    row2(
      'Fecha de Creación', fmtDateLong(new Date(sim.savedAt)),
      'Período Académico', s.academicPeriod || '—',
    );

    y += 6;

    // ══════════════════════════════════════════════════════════
    // SECCIÓN 2: Información de la Financiación
    // ══════════════════════════════════════════════════════════
    sectionHeader('2. Información de la Financiación');

    row2('Valor Matrícula (Bruto)', cop(s.tuitionGross), '% Beca / Descuento', `${s.scholarshipPct}%`);
    row2('Matrícula Neta', cop(s.tuitionNet), 'Cuota Inicial', `${cop(s.initialPayment)} (${s.initialPaymentPct}%)`, true);
    row2(
      'Valor a Financiar', cop(s.financedValue),
      'Tasa de Interés Mensual',
      s.interestMode === 'con_interes'
        ? `${(sim.appliedRateMonthly * 100).toFixed(2)}% M.V.`
        : '0% (Sin intereses)',
    );
    row2('Número de Cuotas', String(s.numberOfPayments), 'Cuota Fija Mensual Estimada', cop(s.periodicPayment), true);

    y += 6;

    // ══════════════════════════════════════════════════════════
    // SECCIÓN 3: Resumen Financiero
    // ══════════════════════════════════════════════════════════
    sectionHeader('3. Resumen Financiero');

    row2('Total a Pagar', cop(s.totalPaid), 'Total Intereses', cop(s.totalInterest));
    if (sim.studentObservation) {
      row1('Observaciones del Estudiante', sim.studentObservation, true);
    }

    y += 6;

    // ══════════════════════════════════════════════════════════
    // SECCIÓN 4: Capital vs Intereses (pie chart B&N)
    // ══════════════════════════════════════════════════════════
    sectionHeader('4. Distribución Capital vs Intereses');

    const capital  = s.financedValue;
    const interest = s.totalInterest;
    const totalVal = capital + interest;

    if (totalVal > 0) {
      const CHART_H = 130;
      // ¿Cabe en la página?
      if (y + CHART_H > PAGE_H) { newPage(); sectionHeader('4. Distribución Capital vs Intereses'); }

      const cx      = ML + PW / 2;
      const cy      = y + 65;
      const r       = 50;
      const capFrac = capital / totalVal;
      const capPct  = Math.round(capFrac * 100);

      if (capFrac < 1) {
        const capEndDeg = -90 + capFrac * 360;
        drawPieSlice(doc, cx, cy, r, -90, capEndDeg,       DARK_GRAY);
        drawPieSlice(doc, cx, cy, r, capEndDeg, -90 + 360, LIGHT_GRAY);
      } else {
        doc.circle(cx, cy, r).fill(DARK_GRAY);
      }
      // Agujero donut
      doc.circle(cx, cy, r * 0.50).fill(WHITE);

      // Texto central
      doc.fontSize(11).fillColor(NEAR_BLACK).font('Helvetica-Bold')
         .text(`${capPct}%`, cx - 20, cy - 10, { width: 40, align: 'center' });
      doc.fontSize(7).fillColor(MID_GRAY).font('Helvetica')
         .text('Capital', cx - 20, cy + 5, { width: 40, align: 'center' });

      // Leyenda debajo del gráfico
      const legY = cy + r + 10;
      doc.rect(cx - 60, legY, 10, 7).fill(DARK_GRAY);
      doc.fontSize(7.5).fillColor(DARK_GRAY).font('Helvetica-Bold')
         .text(`Capital  ${capPct}%`, cx - 46, legY)
         .text(`(${cop(capital)})`, cx - 46, legY + 9);

      doc.rect(cx + 20, legY, 10, 7).fill(LIGHT_GRAY);
      doc.fontSize(7.5).fillColor(MID_GRAY).font('Helvetica-Bold')
         .text(`Intereses  ${100 - capPct}%`, cx + 34, legY)
         .text(`(${cop(interest)})`, cx + 34, legY + 9);

      y = legY + 22;
    }

    y += 8;

    // ══════════════════════════════════════════════════════════
    // SECCIÓN 5: Cronograma de Amortización
    // ══════════════════════════════════════════════════════════
    const ROW_H  = 18;
    const HEAD_H = 22;
    // Anchos: N°|Fecha|Saldo Ini|Capital|Interés|Valor Cuota|Saldo Final
    const cols  = [28, 66, 76, 70, 60, 76, 76] as const;
    const colX: number[] = [];
    let cx2 = ML;
    for (const w of cols) { colX.push(cx2); cx2 += w; }

    function drawAmortHeader(yy: number): number {
      const headers = ['N°', 'Fecha', 'Saldo Inicial', 'Capital', 'Interés', 'Valor Cuota', 'Saldo Final'];
      doc.rect(ML, yy, PW, HEAD_H).fill(DARK_GRAY);
      // Líneas divisorias verticales de cabecera
      let xc = ML;
      for (let i = 0; i < cols.length; i++) {
        xc += cols[i];
        if (i < cols.length - 1) {
          doc.moveTo(xc, yy).lineTo(xc, yy + HEAD_H)
             .strokeColor('#666666').lineWidth(0.4).stroke();
        }
      }
      headers.forEach((h, i) => {
        doc.fontSize(7).fillColor(WHITE).font('Helvetica-Bold')
           .text(h, colX[i] + 2, yy + 7, { width: cols[i] - 4, align: i <= 1 ? 'left' : 'right' });
      });
      doc.rect(ML, yy, PW, HEAD_H).stroke(BLACK);
      return yy + HEAD_H;
    }

    // ¿Cabe la sección?
    if (y + HEAD_H + ROW_H * 3 > PAGE_H) { newPage(); }

    // Título sección
    doc.rect(ML, y, PW, 18).fill(NEAR_BLACK);
    doc.rect(ML, y, PW, 18).stroke(BLACK);
    doc.fontSize(8.5).fillColor(WHITE).font('Helvetica-Bold')
       .text('5. CRONOGRAMA DE AMORTIZACIÓN', ML + 7, y + 4, { width: PW - 14 });
    y += 18;

    // Banner pago inicial (B&N)
    doc.rect(ML, y, PW, 18).fill(ROW_ALT);
    doc.rect(ML, y, PW, 18).stroke(RULE_GRAY);
    doc.fontSize(7.5).fillColor(DARK_GRAY).font('Helvetica-Bold')
       .text(
         `Pago inicial (Cuota 1): ${cop(s.initialPayment)}  (${s.initialPaymentPct}% — no genera intereses)`,
         ML + 7, y + 4, { width: PW - 14 },
       );
    y += 18;

    if (s.schedule.length === 0) {
      doc.rect(ML, y, PW, 22).fill(WHITE).stroke(RULE_GRAY);
      doc.fontSize(8).fillColor(MID_GRAY).font('Helvetica')
         .text('Sin cuotas periódicas. La simulación corresponde a pago único.',
           ML + 7, y + 6, { width: PW - 14 });
      y += 22;
    } else {
      y = drawAmortHeader(y);

      s.schedule.forEach((r, idx) => {
        if (y + ROW_H > PAGE_H) {
          newPage();
          y = drawAmortHeader(y);
        }

        const bg = idx % 2 === 0 ? WHITE : ROW_ALT;
        doc.rect(ML, y, PW, ROW_H).fill(bg);

        const cells = [
          String(r.period),
          fmtDateShort(r.date),
          cop(r.initialBalance),
          cop(r.principal),
          cop(r.interest),
          cop(r.payment),
          cop(r.finalBalance),
        ];

        // Divisores verticales dentro de la fila
        let xc2 = ML;
        for (let i = 0; i < cols.length; i++) {
          xc2 += cols[i];
          if (i < cols.length - 1) {
            doc.moveTo(xc2, y).lineTo(xc2, y + ROW_H)
               .strokeColor(RULE_GRAY).lineWidth(0.3).stroke();
          }
        }

        cells.forEach((cell, i) => {
          doc.fontSize(7.5).fillColor(NEAR_BLACK).font('Helvetica')
             .text(cell, colX[i] + 3, y + 4, { width: cols[i] - 6, align: i <= 1 ? 'left' : 'right' });
        });

        // Borde horizontal inferior
        doc.moveTo(ML, y + ROW_H).lineTo(ML + PW, y + ROW_H)
           .strokeColor(RULE_GRAY).lineWidth(0.3).stroke();

        // Borde exterior de la fila (sin redibujar cada vez el rect completo)
        doc.rect(ML, y, PW, ROW_H).stroke(RULE_GRAY);

        y += ROW_H;
      });
    }

    y += 10;

    // ══════════════════════════════════════════════════════════
    // Nota referencial (fondo muy claro, texto gris)
    // ══════════════════════════════════════════════════════════
    if (y + 22 > PAGE_H) { newPage(); }
    doc.rect(ML, y, PW, 20).fill(ROW_ALT).stroke(RULE_GRAY);
    doc.fontSize(7).fillColor(LIGHT_GRAY).font('Helvetica')
       .text(
         'Nota: Los valores calculados son referenciales y pueden variar según políticas institucionales vigentes. ' +
         'Universidad Pontificia Bolivariana.',
         ML + 7, y + 5, { width: PW - 14 },
       );

    // ── Numeración de páginas ─────────────────────────────────
    const totalPages = doc.bufferedPageRange().count;
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(i);
      doc.fontSize(6.5).fillColor(LIGHT_GRAY).font('Helvetica')
         .text(
           `Página ${i + 1} de ${totalPages}`,
           ML, doc.page.height - 28,
           { width: PW, align: 'right' },
         );
    }

    doc.end();
  });
}
