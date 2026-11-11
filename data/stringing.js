// Restringing price list. Prices are per racket and include the string and labour.
// Each row: [string name, gauges, price, catalogue product handle (optional), note (optional)]
window.STRINGING = {
  updated: "13 May 2026",
  bringYourOwn: 15, // labour only, customer supplies the string
  delivery: 8,      // pick-up and drop-off
  groups: [
    { name: "Polyester — Solinco", items: [
      ["Solinco Hyper-G", ["1.20mm", "1.15mm"], 28, "solinco-hyper-g"],
      ["Solinco Hyper-G Soft", ["1.20mm", "1.15mm"], 28],
      ["Solinco Tour Bite", ["1.20mm", "1.15mm"], 28, "solinco-tour-bite"],
      ["Solinco Tour Bite Soft", ["1.20mm", "1.15mm"], 28],
      ["Solinco Confidential", ["1.20mm", "1.15mm"], 28, "solinco-confidential"],
      ["Solinco Confidential Soft", ["1.20mm"], 30, "solinco-confidential-soft"],
      ["Solinco Mach-10", ["1.20mm", "1.15mm"], 30, "solinco-mach-10"],
    ] },
    { name: "Polyester — MSV", items: [
      ["MSV Focus Hex Soft", ["1.25mm", "1.20mm", "1.15mm"], 25, "msv-focus-hex-soft"],
      ["MSV Focus Hex", ["1.23mm", "1.18mm", "1.10mm"], 25, "msv-focus-hex"],
      ["MSV Hepta Twist", ["1.25mm", "1.20mm", "1.15mm"], 25],
      ["MSV Co Focus", ["1.18mm"], 27],
      ["MSV Focus Hex Ultra", ["1.15mm"], 27, "msv-focus-hex-ultra"],
    ] },
    { name: "Polyester — Poly Star", items: [
      ["Poly Star Classic", ["1.20mm"], 24, "poly-star-classic"],
      ["Poly Star Energy", ["1.20mm"], 25],
      ["Poly Star Strike", ["1.25mm"], 25],
      ["Poly Star Turbo", ["1.25mm"], 25],
      ["Poly Star Storm Pro", ["1.25mm"], 26],
    ] },
    { name: "Polyester — Toroline", items: [
      ["Toroline Wasabi", ["1.23mm"], 30, "toroline-wasabi-1-23mm"],
      ["Toroline Ether", ["1.20mm"], 30],
      ["Toroline Caviar", ["1.16mm"], 30, "toroline-cavier"],
      ["Toroline Snapper", ["1.23mm"], 30],
      ["Toroline O-Toro", ["1.23mm"], 32, "toroline-o-toro-1-23mm"],
      ["Toroline O-Toro Spin", ["1.23mm"], 32, "toroline-o-toro-spin-1-23"],
      ["Toroline O-Toro Tour", ["1.23mm"], 32],
      ["Toroline Truffle X", ["1.30mm"], 23, "", "half set"],
    ] },
    { name: "Polyester — Grapplesnake", items: [
      ["Grapplesnake Tour M8", ["1.25mm"], 31],
      ["Grapplesnake Tour Sniper", ["1.25mm"], 33],
    ] },
    { name: "Polyester — ReString", items: [
      ["ReString Sync", ["1.25mm", "1.20mm"], 32],
      ["ReString Zero", ["1.23mm"], 32],
      ["ReString Vivo", ["1.23mm"], 35],
    ] },
    { name: "Polyester — Yonex", items: [
      ["Yonex Polytour Pro", ["1.25mm", "1.20mm", "1.15mm"], 29, "yonex-poly-tour-pro"],
      ["Yonex Polytour Rev", ["1.25mm"], 32],
      ["Yonex Polytour Strike", ["1.25mm"], 32],
    ] },
    { name: "Polyester — Babolat", items: [
      ["Babolat RPM Blast", ["1.25mm"], 29],
      ["Babolat RPM Blast Rough", ["1.25mm"], 29],
      ["Babolat RPM Team", ["1.25mm"], 29],
    ] },
    { name: "Polyester — Luxilon", items: [
      ["Luxilon 4G", ["1.25mm"], 32, "luxilon-4g-1-25mm"],
      ["Luxilon ALU Power", ["1.25mm", "1.20mm", "1.15mm", "1.10mm"], 34, "luxilon-alu-power"],
      ["Luxilon ALU Power Rough", ["1.25mm"], 36, "luxilon-alu-power-rough-1-25mm"],
    ] },
    { name: "Polyester — Others", items: [
      ["Dyreex Cube Max", ["1.20mm"], 24],
      ["Dyreex Solaris", ["1.20mm"], 24],
      ["Pro's Pro Hexaspin", ["1.20mm"], 24],
      ["Prokennex IQ Hexa", ["1.23mm", "1.18mm"], 24, "prokennex-iq-hexa"],
      ["Volkl Cyclone", ["1.25mm", "1.20mm"], 24, "volkl-cyclone"],
      ["Oehms Alu Pearl Rough", ["1.25mm"], 24],
      ["Taan TT8600", ["1.20mm"], 24],
      ["Signum Pro Firestorm", ["1.20mm"], 24],
      ["Weiss Cannon Mosquito Bite", ["1.19mm"], 26],
      ["Weiss Cannon Silverstring", ["1.20mm"], 26],
      ["HEAD Lynx Tour", ["1.25mm"], 28, "head-lynx-tour-1-25mm"],
      ["Toalson HD Aster Poly", ["1.25mm", "1.19mm"], 28],
    ] },
    { name: "Synthetic gut", items: [
      ["Gosen OG-Sheep Micro", ["1.22mm"], 24],
      ["Prince Synthetic Gut Duraflex", ["1.22mm"], 26],
      ["Toalson TOA Gold", ["1.30mm"], 26],
    ] },
    { name: "Multifilament", items: [
      ["HEAD Velocity", ["1.30mm", "1.25mm"], 28],
      ["Solinco Vanquish", ["1.30mm"], 28],
      ["HEAD RIP Control", ["1.30mm"], 30, "head-rip-control-1-30mm"],
      ["Gamma TNT2", ["1.32mm"], 32],
      ["Weiss Cannon Explosiv!", ["1.30mm"], 32],
      ["Yonex Rexis Feel", ["1.25mm", "1.30mm"], 34, "yonex-rexis-feel-1-25mm"],
      ["Gosen Multi CX", ["1.25mm"], 35],
      ["Tecnifibre X-One Biphase", ["1.24mm", "1.30mm"], 38],
    ] },
    { name: "Natural gut", items: [
      ["Luxilon Natural Gut", ["1.20mm", "1.25mm"], 75],
      ["Babolat VS Touch", ["1.30mm"], 75],
    ] },
  ],
  // Shown under the string prices. Each row: [name, price text]
  extras: [
    { name: "Accessories", items: [
      ["Wilson Pro Overgrips", "$3.50 / grip"],
      ["Toalson Power Grips", "$3.50 / grip"],
      ["MSV Dry Grips", "$3.50 / grip"],
      ["Yonex Dry Super Grap Overgrip", "$3.50 / grip"],
      ["Djokovic / Federer Dampener", "$6"],
      ["Mahjong Dampener (set of 2)", "$15"],
      ["Tennis Ball Picker Tube", "$18"],
      ["Pickleball Ball Picker Tube", "$21"],
      ["Kids Green Balls (30 balls / pack)", "$60"],
      ["Kids Orange Balls (30 balls / pack)", "$60"],
    ] },
    { name: "Other services", items: [
      ["Racket diagnosis", "$5"],
      ["Racket customisation", "$50"],
    ] },
  ],
};
