import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../services/admin_api.dart';

class FeatureRequestsScreen extends StatefulWidget {
  const FeatureRequestsScreen({super.key});

  @override
  State<FeatureRequestsScreen> createState() => _FeatureRequestsScreenState();
}

class _FeatureRequestsScreenState extends State<FeatureRequestsScreen> {
  List<FeatureRequest> _requests = [];
  bool _loading = true;
  String? _error;
  bool _showUnreadOnly = false;

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
      final requests = await context.read<AdminApi>().getFeatureRequests(unread: _showUnreadOnly ? true : null);
      if (mounted)
        setState(() {
          _requests = requests;
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

  Future<void> _markRead(FeatureRequest req) async {
    if (req.read) return;
    try {
      await context.read<AdminApi>().markRequestRead(req.id);
      if (mounted) {
        setState(() {
          final idx = _requests.indexWhere((r) => r.id == req.id);
          if (idx != -1) {
            _requests = List.of(_requests);
            _requests[idx] = FeatureRequest(id: req.id, deviceId: req.deviceId, message: req.message, read: true, createdAt: req.createdAt);
          }
        });
      }
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final unreadCount = _requests.where((r) => !r.read).length;

    return Scaffold(
      body: Column(
        children: [
          AppBar(
            title: Row(
              children: [
                const Text('Permintaan Fitur'),
                if (unreadCount > 0) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(color: const Color(0xFF6366F1), borderRadius: BorderRadius.circular(10)),
                    child: Text(
                      '$unreadCount baru',
                      style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ],
            ),
            actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load)],
          ),
          // Filter row
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: Row(
              children: [
                FilterChip(
                  label: const Text('Belum Dibaca', style: TextStyle(fontSize: 12)),
                  selected: _showUnreadOnly,
                  onSelected: (v) {
                    setState(() => _showUnreadOnly = v);
                    _load();
                  },
                  selectedColor: const Color(0xFF6366F1).withValues(alpha: 0.15),
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
                : _requests.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.lightbulb_outline_rounded, size: 48, color: cs.onSurfaceVariant),
                        const SizedBox(height: 12),
                        Text(_showUnreadOnly ? 'Tidak ada permintaan baru' : 'Belum ada permintaan fitur', style: TextStyle(color: cs.onSurfaceVariant)),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: _requests.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) => _RequestTile(request: _requests[i], cs: cs, onMarkRead: () => _markRead(_requests[i])),
                  ),
          ),
        ],
      ),
    );
  }
}

class _RequestTile extends StatelessWidget {
  final FeatureRequest request;
  final ColorScheme cs;
  final VoidCallback onMarkRead;

  const _RequestTile({required this.request, required this.cs, required this.onMarkRead});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      color: request.read ? null : const Color(0xFF6366F1).withValues(alpha: 0.04),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: request.read ? cs.outlineVariant : const Color(0xFF6366F1).withValues(alpha: 0.3)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(color: request.read ? cs.surfaceContainerHigh : const Color(0xFF6366F1).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: Icon(Icons.lightbulb_rounded, size: 14, color: request.read ? cs.onSurfaceVariant : const Color(0xFF6366F1)),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    request.deviceId,
                    style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: cs.onSurfaceVariant),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(DateFormat('dd MMM yyyy, HH:mm').format(request.createdAt.toLocal()), style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant)),
                if (!request.read) ...[
                  const SizedBox(width: 8),
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: Color(0xFF6366F1), shape: BoxShape.circle),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 10),
            Text(request.message, style: TextStyle(fontSize: 13, color: cs.onSurface, height: 1.5)),
            if (!request.read) ...[
              const SizedBox(height: 10),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  icon: const Icon(Icons.check_rounded, size: 14),
                  label: const Text('Tandai Dibaca', style: TextStyle(fontSize: 12)),
                  onPressed: onMarkRead,
                  style: TextButton.styleFrom(foregroundColor: const Color(0xFF6366F1), visualDensity: VisualDensity.compact, padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
