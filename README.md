# [planu.mn](https://planu.mn)

<a href="https://planu.mn">
  <img src="frontend/src/app/og-image.png" alt="planu.mn" width="800"/>
</a>

With [planu.mn](https://planu.mn), University of Minnesota students can easily create and share graduation plans using a simple drag-and-drop web interface. We built the app with Next.js for app routing, SQLite for fast course data access, Supabase for authentication and saving user plans, and MantineUI for a consistent, responsive UI.

Preprocessed course information and grade distributions are made possible by [GopherGrades](https://umn.lol) which is maintained by Social Coding at UMN. [open GopherGrades' repository](https://github.com/samyok/gophergrades)

## Host Locally

```bash
cd frontend

npm install

npm run dev
```
- Open [http://localhost:3000](http://localhost:3000)
- Note: To enable login and plan saving, you’ll need to set up a Supabase project and configure environment variables.


## Project Structure

```
frontend/
├── src/
│   ├── app/               # Next.js App Router pages
│   ├── components/        # React components
│   │   ├── atoms/        # Base components
│   │   ├── molecules/    # Compound components
│   │   └── organisms/    # Page sections
│   ├── contexts/         # React context providers
│   ├── lib/             # Utilities and configuration
│   ├── styles/          # Global styles and theming
│   └── types/           # TypeScript definitions
└── public/              # Static assets and data
```


## Development

### Tech Stack

- **Next.js 14** with **React** and the App Router for modern routing and SSR support  
- **SQLite** for fast local access to UMN course data  
- **Supabase** for user authentication and cloud storage of graduation plans  
- **Mantine UI** for responsive, accessible components  
- **TypeScript** for a better developer experience because it looks pretty (we disabled type enforcement)

## Contributing

We welcome contributions! Feel free to:
- Submit bug reports
- Request new features
- Open pull requests

## Team

- Hadi Ahmad ([@hadiahmad06](https://github.com/hadiahmad06))
- Michael Zewdie ([@michael-zewdie](https://github.com/michael-zewdie))
