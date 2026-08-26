sed -i 's/const startX = (loopRegion.start \/ duration) \* width;/const startX = ((loopRegion.start - viewStart) \/ visibleDuration) * width;/' src/components/WaveformHero.tsx
sed -i 's/const endX = (loopRegion.end \/ duration) \* width;/const endX = ((loopRegion.end - viewStart) \/ visibleDuration) * width;/' src/components/WaveformHero.tsx
