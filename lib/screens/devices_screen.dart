import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../services/admin_api.dart';

class DevicesScreen extends StatefulWidget {
  const DevicesScreen({super.key});

  @override
  State<DevicesScreen> createState() => _DevicesScreenState();
}

class _DevicesScreenState extends State<DevicesScreen> {
  List<DeviceInfo> _devices = [];
  bool _loading = true;
  String? _error;
  String _filterStatus = 'all';
  final _searchCtrl = TextEditingController();

  static const _statuses = ['all', 'active', 'trial', 'expired'];
  static const _statusLabels = {'all': 'Semua', 'active': 'Aktif', 'trial': 'Trial', 'expired': 'Kedaluwarsa'};

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final devices = await context.read<AdminApi>().getDevices(status: _filterStatus == 'all' ? null : _filterStatus, query: _searchCtrl.text.trim());
      if (mounted)
        setState(() {
          _devices = devices;
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

  Future<void> _showDeviceActions(DeviceInfo d) async {
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _DeviceActionsSheet(device: d, onDone: _load),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: Column(
        children: [
          AppBar(
            title: const Text('Perangkat'),
            actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load)],
          ),
          // Search + filter bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchCtrl,
                    decoration: InputDecoration(
                      hintText: 'Cari device ID / nama...',
                      prefixIcon: const Icon(Icons.search_rounded, size: 18),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded, size: 18),
                              onPressed: () {
                                _searchCtrl.clear();
                                _load();
                              },
                            )
                          : null,
                      isDense: true,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    ),
                    onSubmitted: (_) => _load(),
                  ),
                ),
                const SizedBox(width: 10),
                DropdownButton<String>(
                  value: _filterStatus,
                  onChanged: (v) {
                    if (v != null) {
                      setState(() => _filterStatus = v);
                      _load();
                    }
                  },
                  items: _statuses
                      .map(
                        (s) => DropdownMenuItem(
                          value: s,
                          child: Text(_statusLabels[s]!, style: const TextStyle(fontSize: 13)),
                        ),
                      )
                      .toList(),
                  borderRadius: BorderRadius.circular(10),
                  underline: const SizedBox(),
                ),
              ],
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                ? Center(
                    child: Text(_error!, style: TextStyle(color: cs.error)),
                  )
                : _devices.isEmpty
                ? const Center(child: Text('Tidak ada perangkat'))
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: _devices.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _DeviceTile(device: _devices[i], cs: cs, onTap: () => _showDeviceActions(_devices[i])),
                  ),
          ),
        ],
      ),
    );
  }
}

class _DeviceTile extends StatelessWidget {
  final DeviceInfo device;
  final ColorScheme cs;
  final VoidCallback onTap;

  const _DeviceTile({required this.device, required this.cs, required this.onTap});

  Color get _statusColor {
    switch (device.status) {
      case 'active':
        return const Color(0xFF16A34A);
      case 'trial':
        return const Color(0xFFF59E0B);
      default:
        return const Color(0xFFDC2626);
    }
  }

  String get _statusLabel {
    switch (device.status) {
      case 'active':
        return device.isPermanent ? 'Aktif Permanen' : 'Aktif';
      case 'trial':
        return 'Trial';
      default:
        return 'Kedaluwarsa';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: ListTile(
        leading: Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(color: _statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
          child: Icon(Icons.smartphone_rounded, size: 20, color: _statusColor),
        ),
        title: Text(
          device.userName ?? device.deviceId,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          overflow: TextOverflow.ellipsis,
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (device.userName != null)
              Text(
                device.deviceId,
                style: const TextStyle(fontSize: 11, fontFamily: 'monospace'),
                overflow: TextOverflow.ellipsis,
              ),
            Text(device.deviceModel, style: const TextStyle(fontSize: 11)),
          ],
        ),
        isThreeLine: device.userName != null,
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: _statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(5)),
              child: Text(
                _statusLabel,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: _statusColor),
              ),
            ),
            if (device.expiryDate != null) ...[const SizedBox(height: 2), Text(DateFormat('dd/MM/yy').format(device.expiryDate!), style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant))],
          ],
        ),
        onTap: onTap,
      ),
    );
  }
}

// ── Device actions bottom sheet ───────────────────────────────────────────────

class _DeviceActionsSheet extends StatefulWidget {
  final DeviceInfo device;
  final VoidCallback onDone;

  const _DeviceActionsSheet({required this.device, required this.onDone});

  @override
  State<_DeviceActionsSheet> createState() => _DeviceActionsSheetState();
}

class _DeviceActionsSheetState extends State<_DeviceActionsSheet> {
  bool _loading = false;
  String? _error;
  DateTime? _pickedDate;

  Future<void> _activate({bool permanent = false}) async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<AdminApi>().activateDevice(widget.device.deviceId, expiryDate: permanent ? null : _pickedDate, permanent: permanent);
      if (mounted) {
        Navigator.pop(context);
        widget.onDone();
      }
    } catch (e) {
      if (mounted)
        setState(() {
          _error = AdminApi.errorMessage(e);
          _loading = false;
        });
    }
  }

  Future<void> _revoke() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Cabut Lisensi?'),
        content: const Text('Perangkat ini tidak akan bisa menggunakan aplikasi.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Batal')),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Cabut'),
          ),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<AdminApi>().revokeDevice(widget.device.deviceId);
      if (mounted) {
        Navigator.pop(context);
        widget.onDone();
      }
    } catch (e) {
      if (mounted)
        setState(() {
          _error = AdminApi.errorMessage(e);
          _loading = false;
        });
    }
  }

  Future<void> _pickDate() async {
    final d = await showDatePicker(context: context, initialDate: DateTime.now().add(const Duration(days: 30)), firstDate: DateTime.now(), lastDate: DateTime.now().add(const Duration(days: 730)));
    if (d != null) setState(() => _pickedDate = d);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final d = widget.device;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(context).bottom),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Text(d.userName ?? 'Perangkat', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const Spacer(),
                IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.pop(context)),
              ],
            ),
            Text(
              d.deviceId,
              style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
              overflow: TextOverflow.ellipsis,
            ),
            Text('${d.deviceModel} • ${d.status.toUpperCase()}', style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
            const SizedBox(height: 20),
            // Pick expiry date
            OutlinedButton.icon(
              icon: const Icon(Icons.calendar_today_rounded, size: 16),
              label: Text(_pickedDate != null ? 'Berakhir: ${DateFormat('dd MMM yyyy').format(_pickedDate!)}' : 'Pilih Tanggal Berakhir'),
              onPressed: _pickDate,
            ),
            const SizedBox(height: 10),
            FilledButton(
              onPressed: _loading ? null : () => _activate(),
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF16A34A)),
              child: const Text('Aktifkan (dengan tanggal)'),
            ),
            const SizedBox(height: 8),
            FilledButton(
              onPressed: _loading ? null : () => _activate(permanent: true),
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF6366F1)),
              child: const Text('Aktifkan Permanen'),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: _loading ? null : _revoke,
              style: OutlinedButton.styleFrom(
                foregroundColor: cs.error,
                side: BorderSide(color: cs.error),
              ),
              child: const Text('Cabut Lisensi'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(8)),
                child: Text(_error!, style: TextStyle(fontSize: 12, color: cs.onErrorContainer)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
