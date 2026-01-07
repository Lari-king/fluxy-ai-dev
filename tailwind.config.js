/** @type {import('tailwindcss').Config} */
const { fontFamily } = require("tailwindcss/defaultTheme") // Importez ceci pour la configuration de la police

module.exports = {
    darkMode: ["class"],
    content: [
      "./index.html",
      "./App.tsx", // Ajoutez App.tsx si ce n'est pas déjà inclus par src
      "./components/**/*.{js,ts,jsx,tsx}", // Assurez-vous que les composants sont bien scannés
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
        colors: {
          // Utilisation de la notation HSL pour permettre la gestion de l'opacité par Tailwind
          // Les variables CSS dans globals.css DOIVENT être définies en HSL (ex: --border: 214.3 31.8% 91.4%;)
          
          // Couleurs principales (Doivent être au format HSL)
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          "input-background": "hsl(var(--input-background))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
          ring: "hsl(var(--ring))",
          
          // Couleurs avec DEFAULT/Foreground
          primary: { 
            DEFAULT: "hsl(var(--primary))", 
            foreground: "hsl(var(--primary-foreground))" 
          },
          secondary: { 
            DEFAULT: "hsl(var(--secondary))", 
            foreground: "hsl(var(--secondary-foreground))" 
          },
          destructive: { 
            DEFAULT: "hsl(var(--destructive))", 
            foreground: "hsl(var(--destructive-foreground))" 
          },
          accent: { 
            DEFAULT: "hsl(var(--accent))", 
            foreground: "hsl(var(--accent-foreground))" 
          },
          muted: { 
            DEFAULT: "hsl(var(--muted))", 
            foreground: "hsl(var(--muted-foreground))" 
          },
          popover: { 
            DEFAULT: "hsl(var(--popover))", 
            foreground: "hsl(var(--popover-foreground))" 
          },
          card: { 
            DEFAULT: "hsl(var(--card))", 
            foreground: "hsl(var(--card-foreground))" 
          },
  
          // Sidebar
          sidebar: "hsl(var(--sidebar))",
          "sidebar-foreground": "hsl(var(--sidebar-foreground))",
          "sidebar-primary": "hsl(var(--sidebar-primary))",
          "sidebar-primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          "sidebar-accent": "hsl(var(--sidebar-accent))",
          "sidebar-accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          "sidebar-border": "hsl(var(--sidebar-border))",
          "sidebar-ring": "hsl(var(--sidebar-ring))",
  
          // Charts
          "chart-1": "hsl(var(--chart-1))",
          "chart-2": "hsl(var(--chart-2))",
          "chart-3": "hsl(var(--chart-3))",
          "chart-4": "hsl(var(--chart-4))",
          "chart-5": "hsl(var(--chart-5))",
        },
        borderRadius: {
          lg: `var(--radius)`,
          md: `calc(var(--radius) - 2px)`,
          sm: "calc(var(--radius) - 4px)",
          xl: "calc(var(--radius) + 4px)",
        },
        // Ajout de la police Inter si vous utilisez celle par défaut
        fontFamily: {
          sans: ["Inter", ...fontFamily.sans],
        },
      },
    },
    plugins: [
      require("@tailwindcss/forms"),
      require("tailwindcss-animate"),
    ],
  };