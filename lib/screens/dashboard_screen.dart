import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../services/admin_api.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  AdminStats? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final stats = await context.read<AdminApi>().getStats();
      if (mounted)
        setState(() {
          _stats = stats;
          _loading = false;
        });
    } catch (e) {
      if (mounted)
        setState(() {
          _error = AdminApi.errorMessage(e);
          _loading = false;
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _load,
        child: CustomScrollView(
          slivers: [
            SliverAppBar(
              title: const Text('Dashboard'),
              floating: true,
              actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load)],
            ),
            if (_loading)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator()))
            else if (_error != null)
              SliverFillRemaining(child: _ErrorState(_error!, onRetry: _load))
            else if (_stats != null)
              SliverPadding(
                padding: const EdgeInsets.all(20),
                sliver: SliverToBoxAdapter(child: _StatsGrid(_stats!, cs)),
              ),
          ],
        ),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  final AdminStats stats;
  final ColorScheme cs;
  const _StatsGrid(this.stats, this.cs);

  @override
  Widget build(BuildContext context) {
    final cards = [
      _StatInfo('Total Perangkat', stats.totalDevices.toString(), Icons.devices_rounded, const Color(0xFF6366F1), '/devices'),
      _StatInfo('Lisensi Aktif', stats.activeDevices.toString(), Icons.check_circle_rounded, const Color(0xFF16A34A), '/devices?status=active'),
      _StatInfo('Sedang Trial', stats.trialDevices.toString(), Icons.timer_rounded, const Color(0xFFF59E0B), '/devices?status=trial'),
      _StatInfo('Kadaluarsa', stats.expiredDevices.toString(), Icons.cancel_rounded, const Color(0xFFDC2626), '/devices?status=expired'),
      _StatInfo('Total Kode', stats.totalCodes.toString(), Icons.vpn_key_rounded, const Color(0xFF0EA5E9), '/codes'),
      _StatInfo('Kode Terpakai', stats.usedCodes.toString(), Icons.check_box_rounded, const Color(0xFF8B5CF6), '/codes'),
    ];

    return Wrap(
      spacing: 14,
      runSpacing: 14,
      children: cards.map((c) => _StatCard(info: c, cs: cs)).toList(),
    );
  }
}

class _StatInfo {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final String route;
  const _StatInfo(this.label, this.value, this.icon, this.color, this.route);
}

class _StatCard extends StatelessWidget {
  final _StatInfo info;
  final ColorScheme cs;
  const _StatCard({required this.info, required this.cs});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.go(info.route),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        width: 180,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: cs.outlineVariant),
          boxShadow: const [BoxShadow(color: Color(0x08000000), blurRadius: 8, offset: Offset(0, 2))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(color: info.color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
              child: Icon(info.icon, size: 20, color: info.color),
            ),
            const SizedBox(height: 14),
            Text(info.value, style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w800, height: 1)),
            const SizedBox(height: 4),
            Text(info.label, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
          ],
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorState(this.message, {required this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.error_outline_rounded, size: 48, color: Theme.of(context).colorScheme.error),
        const SizedBox(height: 12),
        Text(message, textAlign: TextAlign.center),
        const SizedBox(height: 16),
        FilledButton(onPressed: onRetry, child: const Text('Coba Lagi')),
      ],
    ),
  );
}
