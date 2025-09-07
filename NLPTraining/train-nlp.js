import { NlpManager } from 'node-nlp';

async function trainModel() {
  const manager = new NlpManager({ languages: ['en'], forceNER: true });

  // === Technology ===
  manager.addDocument('en', 'Apple unveils new iPhone with advanced AI features', 'technology');
  manager.addDocument('en', 'Google launches new artificial intelligence chatbot', 'technology');
  manager.addDocument('en', 'Microsoft announces major cloud computing updates', 'technology');
  manager.addDocument('en', 'Tesla releases new self-driving software update', 'technology');
  manager.addDocument('en', 'Cybersecurity experts warn of new ransomware attack', 'technology');
  manager.addDocument('en', 'Facebook introduces virtual reality headset', 'technology');
  manager.addDocument('en', 'Amazon develops new drone delivery system', 'technology');
  manager.addDocument('en', 'Netflix invests in streaming technology improvements', 'technology');
  manager.addDocument('en', 'Uber launches autonomous vehicle pilot program', 'technology');
  manager.addDocument('en', 'SpaceX successfully launches satellite constellation', 'technology');
  manager.addDocument('en', 'Intel releases new processor with quantum computing features', 'technology');
  manager.addDocument('en', 'IBM develops blockchain technology for supply chains', 'technology');
  manager.addDocument('en', 'NVIDIA announces breakthrough in machine learning chips', 'technology');
  manager.addDocument('en', 'Zoom introduces new video conferencing features', 'technology');
  manager.addDocument('en', 'Twitter updates algorithm to combat misinformation', 'technology');
  manager.addDocument('en', 'Spotify launches AI-powered music recommendation system', 'technology');
  manager.addDocument('en', 'Adobe releases new creative software with AI tools', 'technology');
  manager.addDocument('en', 'Salesforce integrates artificial intelligence into CRM platform', 'technology');
  manager.addDocument('en', 'Oracle announces cloud database security enhancements', 'technology');
  manager.addDocument('en', 'Cisco develops new networking equipment for 5G networks', 'technology');

  // === Environment ===
  manager.addDocument('en', 'Climate change causes record-breaking temperatures worldwide', 'environment');
  manager.addDocument('en', 'Scientists discover new species in Amazon rainforest', 'environment');
  manager.addDocument('en', 'Ocean plastic pollution reaches alarming levels', 'environment');
  manager.addDocument('en', 'Renewable energy adoption increases globally', 'environment');
  manager.addDocument('en', 'Deforestation rates accelerate in tropical regions', 'environment');
  manager.addDocument('en', 'Arctic ice melting at unprecedented rate', 'environment');
  manager.addDocument('en', 'Wildlife conservation efforts save endangered species', 'environment');
  manager.addDocument('en', 'Air quality improves in major cities during lockdown', 'environment');
  manager.addDocument('en', 'Coral reef bleaching affects marine ecosystems', 'environment');
  manager.addDocument('en', 'Solar panel installations reach record numbers', 'environment');
  manager.addDocument('en', 'Wind farm construction creates jobs in rural areas', 'environment');
  manager.addDocument('en', 'Electric vehicle sales surge as gas prices rise', 'environment');
  manager.addDocument('en', 'Carbon emissions decrease due to pandemic restrictions', 'environment');
  manager.addDocument('en', 'Water scarcity affects millions in drought-stricken regions', 'environment');
  manager.addDocument('en', 'Biodiversity loss threatens global food security', 'environment');
  manager.addDocument('en', 'Green building standards become mandatory in cities', 'environment');
  manager.addDocument('en', 'Sustainable agriculture practices gain popularity', 'environment');
  manager.addDocument('en', 'Waste recycling programs expand nationwide', 'environment');
  manager.addDocument('en', 'Environmental activists protest against fossil fuel projects', 'environment');
  manager.addDocument('en', 'Natural disasters increase due to climate change', 'environment');

  // === Business ===
  manager.addDocument('en', 'Stock market reaches new all-time high', 'business');
  manager.addDocument('en', 'Federal Reserve raises interest rates to combat inflation', 'business');
  manager.addDocument('en', 'Major corporation announces quarterly earnings report', 'business');
  manager.addDocument('en', 'Startup receives million-dollar funding round', 'business');
  manager.addDocument('en', 'Merger between two tech giants creates industry leader', 'business');
  manager.addDocument('en', 'Unemployment rate drops to lowest level in decades', 'business');
  manager.addDocument('en', 'Cryptocurrency market experiences major volatility', 'business');
  manager.addDocument('en', 'Supply chain disruptions affect global trade', 'business');
  manager.addDocument('en', 'Real estate market shows signs of cooling', 'business');
  manager.addDocument('en', 'Oil prices fluctuate due to geopolitical tensions', 'business');
  manager.addDocument('en', 'Retail sales increase during holiday season', 'business');
  manager.addDocument('en', 'Manufacturing sector reports strong growth', 'business');
  manager.addDocument('en', 'Bank announces new digital banking services', 'business');
  manager.addDocument('en', 'Insurance company settles major lawsuit', 'business');
  manager.addDocument('en', 'Consulting firm expands international operations', 'business');
  manager.addDocument('en', 'Pharmaceutical company receives FDA approval', 'business');
  manager.addDocument('en', 'Automotive industry shifts toward electric vehicles', 'business');
  manager.addDocument('en', 'Restaurant chain files for bankruptcy protection', 'business');
  manager.addDocument('en', 'Investment firm launches new mutual fund', 'business');
  manager.addDocument('en', 'Telecommunications company upgrades network infrastructure', 'business');

  // === Science ===
  manager.addDocument('en', 'Researchers discover new planet in distant solar system', 'science');
  manager.addDocument('en', 'Breakthrough in cancer treatment shows promising results', 'science');
  manager.addDocument('en', 'Scientists develop new vaccine for infectious disease', 'science');
  manager.addDocument('en', 'Quantum computing experiment achieves major milestone', 'science');
  manager.addDocument('en', 'Archaeologists uncover ancient civilization ruins', 'science');
  manager.addDocument('en', 'Genetic research reveals new insights into human evolution', 'science');
  manager.addDocument('en', 'Physics experiment confirms theoretical predictions', 'science');
  manager.addDocument('en', 'Medical breakthrough in treating rare genetic disorder', 'science');
  manager.addDocument('en', 'Astronomers observe mysterious cosmic phenomenon', 'science');
  manager.addDocument('en', 'Chemistry research leads to new sustainable materials', 'science');
  manager.addDocument('en', 'Neuroscience study reveals brain plasticity mechanisms', 'science');
  manager.addDocument('en', 'Biotechnology company develops new drug delivery system', 'science');
  manager.addDocument('en', 'Climate scientists publish comprehensive study on global warming', 'science');
  manager.addDocument('en', 'Robotics researchers create advanced humanoid robot', 'science');
  manager.addDocument('en', 'Mathematics breakthrough solves century-old problem', 'science');
  manager.addDocument('en', 'Marine biologists discover new deep-sea species', 'science');
  manager.addDocument('en', 'Space telescope captures unprecedented images of distant galaxies', 'science');
  manager.addDocument('en', 'Laboratory experiment produces fusion energy breakthrough', 'science');
  manager.addDocument('en', 'Scientific journal publishes peer-reviewed research findings', 'science');
  manager.addDocument('en', 'University research team receives prestigious grant', 'science');

  // === Politics ===
  manager.addDocument('en', 'President delivers State of the Union address', 'politics');
  manager.addDocument('en', 'Congress passes landmark legislation on healthcare reform', 'politics');
  manager.addDocument('en', 'Supreme Court issues ruling on constitutional rights', 'politics');
  manager.addDocument('en', 'Senate confirms new cabinet member nomination', 'politics');
  manager.addDocument('en', 'Election results show close race in key battleground state', 'politics');
  manager.addDocument('en', 'Political party announces new policy platform', 'politics');
  manager.addDocument('en', 'Government shutdown averted with last-minute budget deal', 'politics');
  manager.addDocument('en', 'Foreign policy experts discuss international relations', 'politics');
  manager.addDocument('en', 'Lobbying groups spend millions on political campaigns', 'politics');
  manager.addDocument('en', 'Voter turnout reaches record levels in midterm elections', 'politics');
  manager.addDocument('en', 'Political scandal rocks administration', 'politics');
  manager.addDocument('en', 'Bipartisan committee investigates government corruption', 'politics');
  manager.addDocument('en', 'State legislature passes controversial new law', 'politics');
  manager.addDocument('en', 'Political debate focuses on economic policy differences', 'politics');
  manager.addDocument('en', 'Campaign finance reform bill introduced in Congress', 'politics');
  manager.addDocument('en', 'Diplomatic relations strained between nations', 'politics');
  manager.addDocument('en', 'Political poll shows shifting voter preferences', 'politics');
  manager.addDocument('en', 'Government agency faces congressional oversight hearing', 'politics');
  manager.addDocument('en', 'Political commentator analyzes election strategy', 'politics');
  manager.addDocument('en', 'Protesters gather outside government building', 'politics');

  // === Entertainment ===
  manager.addDocument('en', 'Hollywood blockbuster breaks box office records', 'entertainment');
  manager.addDocument('en', 'Award show celebrates best performances of the year', 'entertainment');
  manager.addDocument('en', 'Celebrity couple announces engagement on social media', 'entertainment');
  manager.addDocument('en', 'Streaming service releases highly anticipated series', 'entertainment');
  manager.addDocument('en', 'Music artist drops surprise album to critical acclaim', 'entertainment');
  manager.addDocument('en', 'Reality TV show controversy sparks social media debate', 'entertainment');
  manager.addDocument('en', 'Broadway musical wins multiple Tony Awards', 'entertainment');
  manager.addDocument('en', 'Video game developer announces new title release', 'entertainment');
  manager.addDocument('en', 'Comedian performs sold-out stand-up comedy tour', 'entertainment');
  manager.addDocument('en', 'Fashion designer showcases collection at Paris Fashion Week', 'entertainment');
  manager.addDocument('en', 'Podcast becomes most downloaded show of the year', 'entertainment');
  manager.addDocument('en', 'Dance competition show crowns new champion', 'entertainment');
  manager.addDocument('en', 'Animated film receives Oscar nomination for Best Picture', 'entertainment');
  manager.addDocument('en', 'Rock band announces farewell tour dates', 'entertainment');
  manager.addDocument('en', 'Television network renews popular sitcom for another season', 'entertainment');
  manager.addDocument('en', 'Movie star signs multi-million dollar contract for new film', 'entertainment');
  manager.addDocument('en', 'Comic book adaptation dominates summer movie season', 'entertainment');
  manager.addDocument('en', 'Talk show host interviews controversial political figure', 'entertainment');
  manager.addDocument('en', 'Drama series finale breaks viewership records', 'entertainment');
  manager.addDocument('en', 'Celebrity chef opens new restaurant in major city', 'entertainment');

  // === Sports ===
  manager.addDocument('en', 'Championship game goes into overtime thriller', 'sports');
  manager.addDocument('en', 'Olympic athlete breaks world record in track event', 'sports');
  manager.addDocument('en', 'Professional team trades star player to rival', 'sports');
  manager.addDocument('en', 'College basketball tournament reaches final four', 'sports');
  manager.addDocument('en', 'Soccer match ends in dramatic penalty shootout', 'sports');
  manager.addDocument('en', 'Baseball player hits walk-off home run in playoffs', 'sports');
  manager.addDocument('en', 'Tennis champion wins Grand Slam tournament', 'sports');
  manager.addDocument('en', 'Football quarterback signs record-breaking contract', 'sports');
  manager.addDocument('en', 'Hockey team advances to Stanley Cup finals', 'sports');
  manager.addDocument('en', 'Golf tournament features dramatic playoff finish', 'sports');
  manager.addDocument('en', 'Basketball star announces retirement from NBA', 'sports');
  manager.addDocument('en', 'Soccer league implements new video review system', 'sports');
  manager.addDocument('en', 'Olympic committee selects host city for future games', 'sports');
  manager.addDocument('en', 'College football rivalry game draws record attendance', 'sports');
  manager.addDocument('en', 'Boxing match ends in controversial decision', 'sports');
  manager.addDocument('en', 'Formula One driver wins championship in final race', 'sports');
  manager.addDocument('en', 'Swimming competition produces multiple world records', 'sports');
  manager.addDocument('en', 'Basketball team makes historic comeback victory', 'sports');
  manager.addDocument('en', 'Soccer player transfers for record transfer fee', 'sports');
  manager.addDocument('en', 'Baseball pitcher throws perfect game', 'sports');

  // === Crime ===
  manager.addDocument('en', 'Police arrest suspect in high-profile murder case', 'crime');
  manager.addDocument('en', 'Federal agents raid organized crime operation', 'crime');
  manager.addDocument('en', 'Court sentences convicted criminal to prison term', 'crime');
  manager.addDocument('en', 'Cybercrime investigation leads to multiple arrests', 'crime');
  manager.addDocument('en', 'Bank robbery suspect remains at large', 'crime');
  manager.addDocument('en', 'Drug trafficking ring dismantled by law enforcement', 'crime');
  manager.addDocument('en', 'White-collar crime investigation uncovers fraud scheme', 'crime');
  manager.addDocument('en', 'Gang violence escalates in urban neighborhood', 'crime');
  manager.addDocument('en', 'Hate crime incident sparks community outrage', 'crime');
  manager.addDocument('en', 'Police officer involved in controversial shooting incident', 'crime');
  manager.addDocument('en', 'Identity theft ring targets thousands of victims', 'crime');
  manager.addDocument('en', 'Arson investigation reveals insurance fraud motive', 'crime');
  manager.addDocument('en', 'Human trafficking operation discovered by authorities', 'crime');
  manager.addDocument('en', 'Corruption scandal rocks local government', 'crime');
  manager.addDocument('en', 'Serial killer case reopened with new evidence', 'crime');
  manager.addDocument('en', 'Money laundering scheme exposed by financial regulators', 'crime');
  manager.addDocument('en', 'Domestic violence incident leads to protective order', 'crime');
  manager.addDocument('en', 'Juvenile crime rates increase in metropolitan area', 'crime');
  manager.addDocument('en', 'Police department implements new community policing program', 'crime');
  manager.addDocument('en', 'Criminal justice reform bill passes state legislature', 'crime');

  // === Weather ===
  manager.addDocument('en', 'Hurricane makes landfall with devastating winds', 'weather');
  manager.addDocument('en', 'Tornado warning issued for multiple counties', 'weather');
  manager.addDocument('en', 'Blizzard conditions paralyze transportation systems', 'weather');
  manager.addDocument('en', 'Heat wave breaks temperature records across region', 'weather');
  manager.addDocument('en', 'Flooding causes widespread damage to homes', 'weather');
  manager.addDocument('en', 'Drought conditions worsen agricultural crisis', 'weather');
  manager.addDocument('en', 'Thunderstorm produces hail damage to vehicles', 'weather');
  manager.addDocument('en', 'Wildfire spreads rapidly due to dry conditions', 'weather');
  manager.addDocument('en', 'Ice storm creates hazardous driving conditions', 'weather');
  manager.addDocument('en', 'Meteorologists predict severe weather outbreak', 'weather');
  manager.addDocument('en', 'Climate change affects seasonal weather patterns', 'weather');
  manager.addDocument('en', 'Weather satellite captures storm formation', 'weather');
  manager.addDocument('en', 'Rainfall totals exceed monthly averages', 'weather');
  manager.addDocument('en', 'Wind advisory issued for high elevation areas', 'weather');
  manager.addDocument('en', 'Weather radar shows approaching storm system', 'weather');
  manager.addDocument('en', 'Fog conditions reduce visibility on highways', 'weather');
  manager.addDocument('en', 'Weather forecast predicts sunny weekend ahead', 'weather');
  manager.addDocument('en', 'Meteorological department issues weather alert', 'weather');
  manager.addDocument('en', 'Weather pattern brings unseasonable temperatures', 'weather');
  manager.addDocument('en', 'Weather-related power outages affect thousands', 'weather');

  // === Travel ===
  manager.addDocument('en', 'Airlines announce new international flight routes', 'travel');
  manager.addDocument('en', 'Tourist destination sees record visitor numbers', 'travel');
  manager.addDocument('en', 'Cruise ship launches maiden voyage to exotic ports', 'travel');
  manager.addDocument('en', 'Hotel chain opens luxury resort in tropical location', 'travel');
  manager.addDocument('en', 'Travel restrictions lifted for vaccinated tourists', 'travel');
  manager.addDocument('en', 'Backpacking trail becomes popular among adventure travelers', 'travel');
  manager.addDocument('en', 'Travel agency offers discounted vacation packages', 'travel');
  manager.addDocument('en', 'Tourist attraction implements new safety protocols', 'travel');
  manager.addDocument('en', 'Road trip destinations gain popularity during pandemic', 'travel');
  manager.addDocument('en', 'Travel blogger documents journey through foreign country', 'travel');
  manager.addDocument('en', 'Airport expansion project improves passenger experience', 'travel');
  manager.addDocument('en', 'Travel insurance claims increase due to trip cancellations', 'travel');
  manager.addDocument('en', 'Eco-tourism initiative promotes sustainable travel', 'travel');
  manager.addDocument('en', 'Travel guidebook publishes updated recommendations', 'travel');
  manager.addDocument('en', 'Vacation rental market booms in coastal communities', 'travel');
  manager.addDocument('en', 'Travel technology startup develops booking platform', 'travel');
  manager.addDocument('en', 'Cultural festival attracts international visitors', 'travel');
  manager.addDocument('en', 'Travel photography exhibition showcases global destinations', 'travel');
  manager.addDocument('en', 'Adventure travel company offers extreme sports packages', 'travel');
  manager.addDocument('en', 'Travel industry recovers from pandemic downturn', 'travel');

  console.log('Training model...');
  await manager.train();

  console.log('Saving model to model.nlp...');
  manager.save();

  console.log('✅ Model training complete with 200 examples across 10 categories.');
}

trainModel().catch(console.error);
