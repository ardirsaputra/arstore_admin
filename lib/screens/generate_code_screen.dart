import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../services/admin_api.dart';

class GenerateCodeScreen extends StatefulWidget {
  const GenerateCodeScreen({super.key});

  @override
  State<GenerateCodeScreen> createState() => _GenerateCodeScreenState();
}

class _GenerateCodeScreenState extends State<GenerateCodeScreen> {
  String _type = 'monthly';
  int _quantity = 1;
  bool _loading = false;
  String? _error;
  List<String> _generated = [];

  static const _types = [('monthly', '1 Bulan', 1), ('6months', '6 Bulan', 6), ('yearly', '1 Tahun', 12), ('2years', '2 Tahun', 24), ('lifetime', 'Lifetime', null)];

  Future<void> _generate() async {
    setState(() {
      _loading = true;
      _error = null;
      _generated = [];
    });
    try {
      final typeMeta = _types.firstWhere((t) => t.$1 == _type);
      final codes = await context.read<AdminApi>().generateCodes(type: _type, quantity: _quantity, durationMonths: typeMeta.$3);
      if (mounted)
        setState(() {
          _generated = codes;
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

  void _copyAll() {
    Clipboard.setData(ClipboardData(text: _generated.join('\n')));
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Semua kode disalin')));
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: ListView(
        padding: const EdgeInsets.all(0),
        children: [
          AppBar(title: Text('Generate Kode Aktivasi')),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Jenis Paket',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurface),
                ),
                const SizedBox(height: 10),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _types.map((t) {
                    final selected = _type == t.$1;
                    return ChoiceChip(
                      label: Text(t.$2),
                      selected: selected,
                      onSelected: (_) => setState(() => _type = t.$1),
                      selectedColor: const Color(0xFF6366F1).withValues(alpha: 0.15),
                      labelStyle: TextStyle(color: selected ? const Color(0xFF6366F1) : cs.onSurface, fontWeight: selected ? FontWeight.w600 : FontWeight.w400),
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),
                Text(
                  'Jumlah Kode: $_quantity',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: cs.onSurface),
                ),
                Slider(
                  value: _quantity.toDouble(),
                  min: 1,
                  max: 50,
                  divisions: 49,
                  label: _quantity.toString(),
                  activeColor: const Color(0xFF6366F1),
                  onChanged: (v) => setState(() => _quantity = v.round()),
                ),
                const SizedBox(height: 20),
                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 14),
                    decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(8)),
                    child: Text(_error!, style: TextStyle(fontSize: 13, color: cs.onErrorContainer)),
                  ),
                ],
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _loading ? null : _generate,
                    icon: _loading ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.vpn_key_rounded, size: 18),
                    label: Text('Generate $_quantity Kode'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ),
                if (_generated.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  Row(
                    children: [
                      Text(
                        '${_generated.length} Kode Dihasilkan',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: cs.onSurface),
                      ),
                      const Spacer(),
                      TextButton.icon(
                        icon: const Icon(Icons.copy_all_rounded, size: 16),
                        label: const Text('Salin Semua', style: TextStyle(fontSize: 12)),
                        onPressed: _copyAll,
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color: cs.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: cs.outlineVariant),
                    ),
                    child: Column(
                      children: _generated.asMap().entries.map((entry) {
                        final i = entry.key;
                        final code = entry.value;
                        return Column(
                          children: [
                            ListTile(
                              dense: true,
                              leading: Text(
                                '${i + 1}',
                                style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant, fontWeight: FontWeight.w600),
                              ),
                              title: Text(
                                code,
                                style: const TextStyle(fontFamily: 'monospace', fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 1.2),
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.copy_rounded, size: 16),
                                onPressed: () {
                                  Clipboard.setData(ClipboardData(text: code));
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Kode disalin'), duration: Duration(seconds: 1)));
                                },
                                visualDensity: VisualDensity.compact,
                              ),
                            ),
                            if (i < _generated.length - 1) Divider(height: 1, color: cs.outlineVariant),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
