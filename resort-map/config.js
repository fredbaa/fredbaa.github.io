// Path to your resort map image
const MAP_IMAGE_SRC = "images/resort-map.jpg";
const MAP_IMAGE_ALT = "Resort map";

// Define clickable spots on the map
// top / left are percentages (0 to 100) of the image
const HOTSPOTS = [
  {
    id: "cottage1",
    label: "Cottage 1",
    top: 50,
    left: 25
  },
  {
    id: "cottage2",
    label: "Cottage 2",
    top: 42,
    left: 52
  },
  {
    id: "pool",
    label: "Pool Area",
    top: 65,
    left: 40
  },
  {
    id: "beach",
    label: "Beachfront",
    top: 15,
    left: 60
  }
];

// Define areas and their galleries
// id in HOTSPOTS must match a key in RESORT_AREAS
const RESORT_AREAS = {
  cottage1: {
    name: "Cottage 1",
    description: "Near the garden, good for sunrise views.",
    images: [
      { src: "images/cottage-1.jpg", label: "Front view" },
      { src: "images/cottage-2.webp", label: "Inside" },
      { src: "images/cottage-3.webp", label: "Veranda" }
    ]
  },
  cottage2: {
    name: "Cottage 2",
    description: "Close to the pool, nice for families.",
    images: [
      { src: "images/cottage-1.jpg", label: "Exterior" },
      { src: "images/cottage-2.webp", label: "Bedroom" }
    ]
  },
  pool: {
    name: "Pool Area",
    description: "Central pool with lounge chairs.",
    images: [
      { src: "images/pool-area.webp", label: "Poolside" },
    ]
  },
  beach: {
    name: "Beachfront",
    description: "Direct access to the beach.",
    images: [
      { src: "images/beach.webp", label: "Shoreline" },
    ]
  }
};
