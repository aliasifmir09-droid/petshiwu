/**
 * Retired-URL 301 map (Sep 28 2026).
 *
 * The 233 dead pages found in the top-500 GSC pull were retired products from the
 * PetSmart rebuilds. 22 were exact-alias rescues (legacySlugs). Of the remainder,
 * these 68 are dead products in aisles we STILL SELL, each mapped to a live,
 * inventory-backed subcategory that was verified in the sitemap AND against live
 * Mongo (34-637 products each).
 *
 * The other 143 are in aisles we no longer sell at all and are intentionally
 * excluded here -- they are waiting on Pet's 410-vs-301 decision. Until then they
 * keep their existing 404, which is correct.
 *
 * Source of truth: /workspace/data/gsc_deadpages/redirect_map_final_v2.json
 * (regenerate with scripts/gsc_deadpages_audit.py + the map builder).
 */
export const RETIRED_URL_301: Record<string, string> = {
  "/bird/wild-bird-feeders/all-living-things-wild-bird-hummingbird-feeder": "/bird/wild-bird-food",
  "/bird/wild-bird-feeders/all-living-things-wild-bird-suet-feeder": "/bird/wild-bird-food",
  "/bird/wild-bird-feeders/all-living-things-wild-bird-white-black-feeder": "/bird/wild-bird-food",
  "/bird/wild-bird-feeders/all-living-things-wild-bird-window-feeder": "/bird/wild-bird-food",
  "/bird/wild-bird-food/browns-birdlovers-blend-natural-no-waste-blend-wild-bird-seed": "/bird/pet-bird-food",
  "/bird/wild-bird-food/kaytee-wild-bird-food": "/bird/pet-bird-food",
  "/bird/wild-bird-shop/coops--outdoor-habitats/trixie-outdoor-run--chicken-coop": "/bird/wild-bird-food",
  "/bird/wild-bird-shop/wild-bird-feeders/all-living-things-wild-bird-white--black-feeder": "/bird/wild-bird-food",
  "/bird/wild-bird-shop/wild-bird-food/kaytee-whole-shell-peanuts-wild-bird--wildlife-food": "/bird/pet-bird-food",
  "/cat/dry-food/authority-everyday-health-all-life-stages-dry-cat-food-whitefish": "/cat/dry-food",
  "/cat/dry-food/authority-sensitive-stomach-skin-cat-dry-food-ocean-whitefish-rice-with-grain": "/cat/dry-food",
  "/cat/dry-food/hills-science-diet-hairball-control-light-adult-dry-cat-food-chicken": "/cat/dry-food",
  "/cat/dry-food/hills-science-diet-sensitive-stomach-skin-adult-dry-cat-food-pollock": "/cat/dry-food",
  "/cat/dry-food/iams-proactive-health-senior-dry-cat-food-healthy-aging-chicken": "/cat/dry-food",
  "/cat/dry-food/meow-mix-tender-centers-with-basted-bites-chicken-tuna": "/cat/dry-food",
  "/cat/dry-food/nutro-wholesome-essentials-hairball-control-adult-dry-cat-food-nongmo-chicken-brown-rice": "/cat/dry-food",
  "/cat/dry-food/purina-one-plus-healthy-kitten-dry-cat-food-chicken-high-protein-natural": "/cat/dry-food",
  "/cat/dry-food/purina-pro-plan-vital-systems-adult-cat-dry-food-chicken-egg-formula": "/cat/dry-food",
  "/cat/dry-food/purina-pro-plan-vital-systems-adult-cat-dry-food-salmon-egg-formula": "/cat/dry-food",
  "/cat/dry-food/purina-pro-plan-vital-systems-kitten-dry-food-chicken-egg-formula": "/cat/dry-food",
  "/cat/dry-food/royal-canin-hair-skin-dry-adult-cat-food-3lb": "/cat/dry-food",
  "/cat/dry-food/simply-nourish-urinary-tract-hairball-control-adult-dry-cat-food-natural-chicken": "/cat/dry-food",
  "/cat/dry-food/tiki-cat-solutions-adult-cat-food-digestion-lamb-egg-recipe": "/cat/dry-food",
  "/cat/dry-food/tiki-cat-solutions-adult-cat-food-light-turkey-recipe": "/cat/dry-food",
  "/cat/vet-authorized-diets/purina-pro-plan-veterinary-diets-cat-food-ha-hydrolyzed": "/cat/veterinary-diets",
  "/cat/veterinary-diets/hills-prescription-diet-cd-urinary-care-wet-cat-food-ocean-fish": "/cat/veterinary-diets",
  "/cat/wet-food/fancy-feast-gourmet-naturals-kitten-cat-wet-food-333-oz-natural-with-vitamins": "/cat/wet-food",
  "/cat/wet-food/fancy-feast-petites-all-life-stages-cat-wet-food---topper-variety-pack-12-ct-336-oz": "/cat/wet-food",
  "/cat/wet-food/meow-mix-tender-favorites-wet-cat-food-all-ages-tuna-shrimp-variety-pack-12-ct-33-oz": "/cat/wet-food",
  "/cat/wet-food/nulo-medalseries-all-life-stages-wet-cat-food-grain-free-no-corn-wheat-soy-125-oz": "/cat/wet-food",
  "/cat/wet-food/purina-pro-plan-vital-systems-adult-wet-cat-food-in-gravy-3oz": "/cat/wet-food",
  "/cat/wet-food/sheba-perfect-portions-adult-cat-wet-food-cuts-in-gravy-variety-pack": "/cat/wet-food",
  "/dog/biscuits-cookies--bakery-treats/wiggles-wags-sunburst-peanut-butter-and-strawberry-cookies-dog-treats-14-oz": "/dog/biscuits-cookies--bakery-treats",
  "/dog/bones-bully-sticks--chews/dentleys-rawhide-alternative-peanut-butter-chomping-sticks-22-inch-60-count-2-lb": "/dog/bones-bully-sticks--chews",
  "/dog/bones-bully-sticks--chews/milk-bone-flavor-roll-dog-treats-22-oz": "/dog/bones-bully-sticks--chews",
  "/dog/bones-bully-sticks--chews/pork-chomps-25-baked-pressed-pork-rings-with-chicken-8-ct-11-oz": "/dog/bones-bully-sticks--chews",
  "/dog/bones-bully-sticks--chews/redbarn-collagen-wrapped-esophagus-slices-dog-treats": "/dog/bones-bully-sticks--chews",
  "/dog/dental-treats/bocces-brushy-all-life-stages-dental-sticks-dog-treats-13-oz": "/dog/dental-treats",
  "/dog/dry-food/bill-jac-picky-no-more-small-breed-adult-dry-dog-food-persnickety-recipe-with-chicken-liver": "/dog/dry-food",
  "/dog/dry-food/blue-buffalo-true-solutions-perfect-coat-all-life-stages-dry-dog-food-salmon": "/dog/dry-food",
  "/dog/dry-food/blue-buffalo-wilderness-rocky-mountain-recipe-puppy-dry-dog-food-red-meat": "/dog/dry-food",
  "/dog/dry-food/hills-science-diet-7-senior-dry-dog-food-chicken-barley-brown-rice": "/dog/dry-food",
  "/dog/dry-food/nulo-medalseries-adult-dry-dog-food-salmon": "/dog/dry-food",
  "/dog/dry-food/nulo-medalseries-all-life-stages-dry-dog-food-salmon": "/dog/dry-food",
  "/dog/dry-food/nutro-limited-ingredient-diet-adult-dry-dog-food-grain-free-venison-sweet-potato": "/dog/dry-food",
  "/dog/dry-food/purina-one-plus-natural-real-chicken-large-breed-puppy-dry-dog-food-165-lbs": "/dog/dry-food",
  "/dog/dry-food/purina-one-true-instinct-adult-dog-dry-food-high-protein-natural-venison": "/dog/dry-food",
  "/dog/dry-food/purina-pro-plan-large-breed-adult-dry-dog-food-chicken-rice": "/dog/dry-food",
  "/dog/dry-food/purina-pro-plan-sensitive-skin-stomach-large-breed-adult-dry-dog-food-salmon-rice": "/dog/dry-food",
  "/dog/dry-food/purina-pro-plan-sensitive-skin-stomach-puppy-dry-dog-food-salmon-rice": "/dog/dry-food",
  "/dog/dry-food/rachel-ray-nutrish-large-breed-dog-food-beef-veggie-and-barley": "/dog/dry-food",
  "/dog/dry-food/wellness-core-adult-dry-dog-food-natural-grain-free-original-formula": "/dog/dry-food",
  "/dog/food-toppers/instinct-raw-boost-mixers-freeze-dried-all-life-stages-dog-food-topper-raw-grain-free-beef": "/dog/food-toppers",
  "/dog/food-toppers/stella-chewys-freeze-dried-raw-meal-mixers-all-life-stages-dog-food-topper-salmon-cod": "/dog/food-toppers",
  "/dog/food-toppers/stella-chewys-freeze-dried-raw-meal-mixers-puppy-dog-food-topper-beef-salmon": "/dog/food-toppers",
  "/dog/food/dry-food/hills-science-diet-no-corn-wheat-or-soy-adult-dry-dog-food---chicken--brown-rice": "/dog/dry-food",
  "/dog/food/dry-food/purina-pro-plan-sport-performance-3020-all-life-stages-dry-dog-food---chicken--rice-high-protein": "/dog/dry-food",
  "/dog/soft--chewy-treats/bark-chicken-nuggets-12-oz": "/dog/bones-bully-sticks--chews",
  "/dog/soft--chewy-treats/rachael-ray-nutrish-dog-treat-all-ages-bacon": "/dog/bones-bully-sticks--chews",
  "/dog/treats/biscuits-cookies--bakery-treats/wiggles--wags-carob-chip-cookies-dog-treats-13-oz": "/dog/biscuits-cookies--bakery-treats",
  "/dog/treats/biscuits-cookies--bakery-treats/wiggles--wags-prince-decorated-cookie-dog-treat-226-oz": "/dog/biscuits-cookies--bakery-treats",
  "/dog/treats/biscuits-cookies--bakery-treats/wiggles--wags-princess-decorated-cookie-dog-treat-226-oz": "/dog/biscuits-cookies--bakery-treats",
  "/dog/veterinary-diets/royal-canin-veterinary-diet-gastrointestinal-puppy-ultra-soft-mousse-in-sauce-wet-food-51-oz-can": "/dog/wet-food",
  "/dog/waste-disposal/the-doggie-dooley-pet-poop-disposal-system": "/cat/litter-waste-disposal",
  "/dog/waste-disposal/top-paw-dog-poop-bags-extra-thick-eucalyptus-scent-purple-paws-solids-60-240-count": "/cat/litter-waste-disposal",
  "/dog/wet-food/purina-pro-plan-sport-high-protein-adult-wet-dog-food-salmon-cod-13-oz": "/dog/wet-food",
  "/products/pennington-classic-wild-bird-seed-blend-backyard-feeding": "/bird/wild-bird-food",
  "/products/sfbb-freeze-dried-cyclops-fish-food": "/fish/fish-food"
};
