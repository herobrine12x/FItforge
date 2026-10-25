import { IWeeklySummaryMetrics } from '../models/types';

/**
 * Generates and downloads a high-resolution, shareable single-card PNG image of the weekly summary.
 */
export function exportSummaryAsImage(
  summary: IWeeklySummaryMetrics,
  athleteName: string
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const width = 1200;
      const height = 800;
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas 2D context not supported');
      }

      // 1. Background
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#0B0B0F');
      bgGrad.addColorStop(0.5, '#12121A');
      bgGrad.addColorStop(1, '#1A1A24');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Outer accent border
      ctx.strokeStyle = '#24242E';
      ctx.lineWidth = 4;
      ctx.strokeRect(16, 16, width - 32, height - 32);

      // Top lime accent bar
      ctx.fillStyle = '#C6FF3D';
      ctx.fillRect(20, 20, width - 40, 6);

      // 2. Header
      ctx.fillStyle = '#C6FF3D';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('FITFORGE', 60, 90);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 14px monospace';
      ctx.fillText('WEEKLY TRAINING PERFORMANCE SUMMARY', 270, 75);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Athlete: ${athleteName}`, 270, 105);

      // Week dates pill
      ctx.fillStyle = '#16161D';
      ctx.beginPath();
      ctx.roundRect(width - 380, 55, 320, 48, 12);
      ctx.fill();
      ctx.strokeStyle = '#24242E';
      ctx.stroke();

      ctx.fillStyle = '#C6FF3D';
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`📅 ${summary.weekStart}  →  ${summary.weekEnd}`, width - 360, 85);

      // Divider
      ctx.strokeStyle = '#24242E';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(60, 135);
      ctx.lineTo(width - 60, 135);
      ctx.stroke();

      // 3. Stat Cards Grid (4 tiles across)
      const tiles = [
        { label: 'WORKOUTS COMPLETED', val: `${summary.workoutsDone}`, sub: `Goal: ${summary.weeklyGoal} (${summary.goalProgressPercent}%)` },
        { label: 'TOTAL TRAINING TIME', val: `${summary.totalMinutes}`, sub: 'Active Minutes' },
        { label: 'CALORIES BURNED', val: `${summary.totalCalories.toLocaleString()}`, sub: 'Estimated kcal' },
        { label: 'ACTIVE STREAK', val: `🔥 ${summary.currentStreak}d`, sub: `Best: ${summary.bestStreak} days` },
      ];

      const tileWidth = 250;
      const tileHeight = 140;
      const tileY = 165;
      const gap = 20;

      tiles.forEach((t, idx) => {
        const x = 60 + idx * (tileWidth + gap);

        // Tile bg
        ctx.fillStyle = '#16161D';
        ctx.beginPath();
        ctx.roundRect(x, tileY, tileWidth, tileHeight, 16);
        ctx.fill();
        ctx.strokeStyle = '#24242E';
        ctx.stroke();

        // Label
        ctx.fillStyle = '#A1A1AA';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(t.label, x + 20, tileY + 35);

        // Value
        ctx.fillStyle = '#C6FF3D';
        ctx.font = 'bold 38px sans-serif';
        ctx.fillText(t.val, x + 20, tileY + 85);

        // Sub
        ctx.fillStyle = '#F4F4F6';
        ctx.font = '13px sans-serif';
        ctx.fillText(t.sub, x + 20, tileY + 115);
      });

      // 4. Best Day Card
      const cardY = 335;
      const cardWidth = width - 120;
      const cardHeight = 145;

      ctx.fillStyle = '#16161D';
      ctx.beginPath();
      ctx.roundRect(60, cardY, cardWidth, cardHeight, 18);
      ctx.fill();
      ctx.strokeStyle = '#24242E';
      ctx.stroke();

      // Left bar
      ctx.fillStyle = '#C6FF3D';
      ctx.fillRect(60, cardY + 20, 6, cardHeight - 40);

      ctx.fillStyle = '#A1A1AA';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('🏆 BEST TRAINING DAY OF THE WEEK', 85, cardY + 45);

      if (summary.bestDay) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`${summary.bestDay.dayName} (${summary.bestDay.date}) · ${summary.bestDay.splitName}`, 85, cardY + 85);

        ctx.fillStyle = '#C6FF3D';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`🔥 ${summary.bestDay.caloriesBurned} kcal burned  ·  ⏱️ ${summary.bestDay.durationMinutes} minutes`, 85, cardY + 115);
      } else {
        ctx.fillStyle = '#A1A1AA';
        ctx.font = 'italic 16px sans-serif';
        ctx.fillText('No workout sessions recorded yet this week.', 85, cardY + 95);
      }

      // 5. Next Week Advice Box
      const adviceY = 505;
      const adviceHeight = 180;

      ctx.fillStyle = '#16161D';
      ctx.beginPath();
      ctx.roundRect(60, adviceY, cardWidth, adviceHeight, 18);
      ctx.fill();
      ctx.strokeStyle = '#C6FF3D';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.lineWidth = 1;

      // Header tag
      ctx.fillStyle = '#C6FF3D';
      ctx.beginPath();
      ctx.roundRect(85, adviceY + 25, 230, 28, 8);
      ctx.fill();

      ctx.fillStyle = '#0B0B0F';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('TARGET: WHAT TO AIM FOR NEXT WEEK', 95, adviceY + 44);

      ctx.fillStyle = '#F4F4F6';
      ctx.font = '17px sans-serif';
      
      // Wrap text
      const maxWidth = cardWidth - 60;
      const words = summary.whatToAimForNextWeek.split(' ');
      let line = '';
      let textY = adviceY + 85;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, 85, textY);
          line = words[n] + ' ';
          textY += 28;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 85, textY);

      // 6. Footer
      ctx.fillStyle = '#71717A';
      ctx.font = '12px monospace';
      ctx.fillText('FitForge Workout Tracker  ·  Consistency Over Intensity  ·  fitforge.app', 60, height - 40);

      const todayStr = new Date().toLocaleDateString();
      ctx.fillText(`Generated: ${todayStr}`, width - 240, height - 40);

      // 7. Convert and Download
      const dataUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `FitForge_Weekly_Summary_${summary.weekStart}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      resolve(true);
    } catch (err) {
      console.error('Failed to export summary image:', err);
      reject(err);
    }
  });
}
