# Farmon Frontend

A modern React application built with TypeScript, Vite, and Tailwind CSS for the Farmon Instant Chat platform.

## 🚀 Features

- **Modern Authentication**: Beautiful login and registration pages with real-time validation
- **Dashboard Analytics**: Comprehensive analytics dashboard with interactive charts
- **File Management**: Advanced file upload, management, and sharing capabilities
- **Real-time Chat**: Interactive chat interface with AI integration
- **Responsive Design**: Mobile-first design that works on all devices
- **Type Safety**: Full TypeScript support for better development experience

## 🛠️ Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS for utility-first styling
- **UI Components**: shadcn/ui component library
- **Icons**: Lucide React for modern iconography
- **Charts**: Chart.js with react-chartjs-2 for data visualization
- **HTTP Client**: Axios for API communication
- **Routing**: React Router for client-side navigation

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or bun package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd bolt/frontend
   ```

2. **Install dependencies**
   ```bash
   # Using npm
   npm install
   
   # Using bun (recommended)
   bun install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   ```

4. **Start the development server**
   ```bash
   # Using npm
   npm run dev
   
   # Using bun
   bun run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── Layout.tsx      # Main layout component
├── hooks/              # Custom React hooks
│   └── useAuth.ts      # Authentication hook
├── pages/              # Page components
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Registration page
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Chat.tsx        # Chat interface
│   └── Files.tsx       # File management
├── services/           # API services
│   └── api.ts          # API client configuration
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
├── App.tsx             # Main app component
└── main.tsx            # Application entry point
```

## 🎨 UI Components

### Authentication Pages
- **Modern Login**: Glass-morphism design with gradient backgrounds
- **Registration**: Comprehensive form with password strength indicator
- **Responsive**: Mobile-optimized layouts

### Dashboard
- **Analytics Cards**: Key metrics with visual indicators
- **Interactive Charts**: Real-time data visualization
- **Role-based Views**: Different dashboards for admins and users

### File Management
- **Drag & Drop Upload**: Modern file upload interface
- **Grid/Table Views**: Flexible file viewing options
- **Mobile Responsive**: Touch-friendly mobile interface
- **File Sharing**: Secure file sharing capabilities

### Chat Interface
- **Real-time Messaging**: Instant message delivery
- **File Attachments**: Support for file sharing in chat
- **Responsive Design**: Works seamlessly on all devices

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run type-check

# Linting
npm run lint
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting for consistency
- **Prettier**: Code formatting (if configured)
- **Tailwind CSS**: Utility-first styling approach

### Component Guidelines

1. **Use TypeScript**: All components should be typed
2. **Responsive Design**: Mobile-first approach
3. **Accessibility**: Include proper ARIA labels and keyboard navigation
4. **Performance**: Use React.memo for expensive components
5. **Error Handling**: Implement proper error boundaries

## 🌐 API Integration

### Authentication
- JWT token-based authentication
- Automatic token refresh
- Protected route handling

### Endpoints
- `/auth/login/` - User login
- `/auth/register/` - User registration
- `/auth/logout/` - User logout
- `/files/` - File management
- `/chat/` - Chat functionality
- `/analytics/` - Dashboard data

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Optimizations
- Touch-friendly interfaces
- Optimized table views
- Collapsible navigation
- Gesture support

## 🔒 Security

- **Token Storage**: Secure token management
- **Route Protection**: Authentication-based routing
- **Input Validation**: Client-side validation
- **HTTPS**: Secure communication (production)

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

### Environment Variables

Ensure the following environment variables are set:

- `VITE_API_BASE_URL`: Backend API URL

### Deployment Platforms

- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **AWS S3**: Static website hosting
- **Docker**: Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Review existing issues and discussions

## 🔄 Recent Updates

### v1.0.0
- ✨ Modern authentication pages with glass-morphism design
- 📱 Fully responsive file management interface
- 📊 Enhanced dashboard with interactive charts
- 🎨 Updated UI with Tailwind CSS and Lucide icons
- 🔒 Improved security with JWT authentication
- 📝 Comprehensive TypeScript support

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**