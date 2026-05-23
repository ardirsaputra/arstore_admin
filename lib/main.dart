import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'services/admin_api.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/devices_screen.dart';
import 'screens/generate_code_screen.dart';
import 'screens/payment_info_screen.dart';
import 'screens/feature_requests_screen.dart';

void main() {
  runApp(ChangeNotifierProvider(create: (_) => AdminApi.instance, child: const AdminApp()));
}

final _router = GoRouter(
  initialLocation: '/login',
  redirect: (ctx, state) {
    final api = AdminApi.instance;
    final loggedIn = api.isLoggedIn;
    final goingToLogin = state.matchedLocation == '/login';
    if (!loggedIn && !goingToLogin) return '/login';
    if (loggedIn && goingToLogin) return '/dashboard';
    return null;
  },
  routes: [
    GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
    ShellRoute(
      builder: (ctx, state, child) => AdminShell(child: child),
      routes: [
        GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
        GoRoute(path: '/devices', builder: (_, __) => const DevicesScreen()),
        GoRoute(path: '/codes', builder: (_, __) => const GenerateCodeScreen()),
        GoRoute(path: '/payment-info', builder: (_, __) => const PaymentInfoScreen()),
        GoRoute(path: '/feature-requests', builder: (_, __) => const FeatureRequestsScreen()),
      ],
    ),
  ],
);

class AdminApp extends StatelessWidget {
  const AdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'ArStore Admin',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6366F1), brightness: Brightness.light),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF6366F1), brightness: Brightness.dark),
        useMaterial3: true,
      ),
      routerConfig: _router,
    );
  }
}

// ── Shell with sidebar ───────────────────────────────────────────────────────

class AdminShell extends StatelessWidget {
  final Widget child;
  const AdminShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final wide = MediaQuery.sizeOf(context).width >= 720;
    return Scaffold(
      body: wide ? _WideLayout(child: child) : _NarrowLayout(child: child),
    );
  }
}

class _WideLayout extends StatelessWidget {
  final Widget child;
  const _WideLayout({required this.child});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const AdminSidebar(),
        const VerticalDivider(width: 1),
        Expanded(child: child),
      ],
    );
  }
}

class _NarrowLayout extends StatelessWidget {
  final Widget child;
  const _NarrowLayout({required this.child});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const Drawer(child: AdminSidebar()),
      appBar: AppBar(title: const Text('ArStore Admin')),
      body: child,
    );
  }
}

// ── Sidebar ──────────────────────────────────────────────────────────────────

class AdminSidebar extends StatelessWidget {
  const AdminSidebar({super.key});

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final api = context.watch<AdminApi>();

    final items = [
      _NavItem(Icons.dashboard_rounded, 'Dashboard', '/dashboard'),
      _NavItem(Icons.devices_rounded, 'Perangkat', '/devices'),
      _NavItem(Icons.vpn_key_rounded, 'Generate Kode', '/codes'),
      _NavItem(Icons.payment_rounded, 'Info Pembayaran', '/payment-info'),
      _NavItem(Icons.lightbulb_rounded, 'Permintaan Fitur', '/feature-requests'),
    ];

    return SizedBox(
      width: 220,
      child: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.fromLTRB(20, 24, 20, 20),
            color: Theme.of(context).colorScheme.surfaceContainerHigh,
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: const Color(0xFF6366F1), borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.admin_panel_settings_rounded, size: 20, color: Colors.white),
                ),
                const SizedBox(width: 10),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('ArStore', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
                    Text('Admin Panel', style: TextStyle(fontSize: 11)),
                  ],
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 8),
              children: items.map((item) {
                final selected = location.startsWith(item.route);
                return ListTile(
                  leading: Icon(item.icon, size: 20, color: selected ? const Color(0xFF6366F1) : null),
                  title: Text(
                    item.label,
                    style: TextStyle(fontSize: 13, fontWeight: selected ? FontWeight.w600 : FontWeight.w400, color: selected ? const Color(0xFF6366F1) : null),
                  ),
                  selected: selected,
                  selectedTileColor: const Color(0xFF6366F1).withValues(alpha: 0.08),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                  dense: true,
                  onTap: () => context.go(item.route),
                );
              }).toList(),
            ),
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.logout_rounded, size: 18),
            title: const Text('Keluar', style: TextStyle(fontSize: 13)),
            dense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 12),
            onTap: () {
              api.logout();
              context.go('/login');
            },
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String route;
  const _NavItem(this.icon, this.label, this.route);
}
