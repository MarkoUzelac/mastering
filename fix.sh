sed -i '/<ProcessingChain/c\
                <ProcessingChain\
                  params={params}\
                  advancedParams={advancedParams}\
                  meterData={meterData}\
                  isBypassed={isBypassed}\
                  onParamChange={handleParamChange}\
                  onAdvancedParamChange={handleAdvancedParamChange}\
                  onOpenAdvancedModal={(mod) => setActiveAdvancedModal(mod)}\
                />' src/App.tsx
