sed -i 's/const x = i \* barWidth;/const time = (i \/ numBars) * totalDurationRender;\n        const x = ((time - viewStart) \/ visibleDuration) * width;/' src/components/WaveformHero.tsx
