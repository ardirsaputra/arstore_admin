import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/admin_api.dart';

class PaymentInfoScreen extends StatefulWidget {
  const PaymentInfoScreen({super.key});

  @override
  State<PaymentInfoScreen> createState() => _PaymentInfoScreenState();
}

class _PaymentInfoScreenState extends State<PaymentInfoScreen> {
  final _waCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _bankNameCtrl = TextEditingController();
  final _bankAccountCtrl = TextEditingController();
  final _bankHolderCtrl = TextEditingController();
  final _qrisCtrl = TextEditingController();
  final _noteCtrl = TextEditingController();

  bool _loading = true;
  bool _saving = false;
  String? _error;
  bool _saved = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _waCtrl.dispose();
    _emailCtrl.dispose();
    _bankNameCtrl.dispose();
    _bankAccountCtrl.dispose();
    _bankHolderCtrl.dispose();
    _qrisCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final info = await context.read<AdminApi>().getPaymentInfo();
      if (mounted) {
        _waCtrl.text = info.whatsapp ?? '';
        _emailCtrl.text = info.email ?? '';
        _bankNameCtrl.text = info.bankName ?? '';
        _bankAccountCtrl.text = info.bankAccount ?? '';
        _bankHolderCtrl.text = info.bankHolder ?? '';
        _qrisCtrl.text = info.qrisUrl ?? '';
        _noteCtrl.text = info.note ?? '';
        setState(() {
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted)
        setState(() {
          _error = AdminApi.errorMessage(e);
          _loading = false;
        });
    }
  }

  Future<void> _save() async {
    setState(() {
      _saving = true;
      _error = null;
      _saved = false;
    });
    try {
      final info = AdminPaymentInfo(
        whatsapp: _waCtrl.text.trim().isNotEmpty ? _waCtrl.text.trim() : null,
        email: _emailCtrl.text.trim().isNotEmpty ? _emailCtrl.text.trim() : null,
        bankName: _bankNameCtrl.text.trim().isNotEmpty ? _bankNameCtrl.text.trim() : null,
        bankAccount: _bankAccountCtrl.text.trim().isNotEmpty ? _bankAccountCtrl.text.trim() : null,
        bankHolder: _bankHolderCtrl.text.trim().isNotEmpty ? _bankHolderCtrl.text.trim() : null,
        qrisUrl: _qrisCtrl.text.trim().isNotEmpty ? _qrisCtrl.text.trim() : null,
        note: _noteCtrl.text.trim().isNotEmpty ? _noteCtrl.text.trim() : null,
      );
      await context.read<AdminApi>().updatePaymentInfo(info);
      if (mounted)
        setState(() {
          _saving = false;
          _saved = true;
        });
    } catch (e) {
      if (mounted)
        setState(() {
          _error = AdminApi.errorMessage(e);
          _saving = false;
        });
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(0),
              children: [
                AppBar(
                  title: const Text('Info Pembayaran'),
                  actions: [IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: _load)],
                ),
                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Informasi ini ditampilkan kepada pengguna saat trial berakhir.', style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant, height: 1.5)),
                      const SizedBox(height: 24),
                      _section('Kontak', [
                        _field(_waCtrl, 'Nomor WhatsApp', Icons.chat_rounded, hint: 'Contoh: 628123456789', inputType: TextInputType.phone),
                        const SizedBox(height: 12),
                        _field(_emailCtrl, 'Email Admin', Icons.email_outlined, hint: 'admin@arstore.id', inputType: TextInputType.emailAddress),
                      ]),
                      const SizedBox(height: 20),
                      _section('Rekening Bank', [
                        _field(_bankNameCtrl, 'Nama Bank', Icons.account_balance_rounded, hint: 'Contoh: BCA, BNI, Mandiri'),
                        const SizedBox(height: 12),
                        _field(_bankAccountCtrl, 'Nomor Rekening', Icons.credit_card_rounded, hint: '1234567890', inputType: TextInputType.number),
                        const SizedBox(height: 12),
                        _field(_bankHolderCtrl, 'Atas Nama', Icons.person_outline_rounded, hint: 'Nama pemilik rekening'),
                      ]),
                      const SizedBox(height: 20),
                      _section('QRIS', [_field(_qrisCtrl, 'URL Gambar QRIS', Icons.qr_code_rounded, hint: 'https://example.com/qris.png')]),
                      const SizedBox(height: 20),
                      _section('Catatan', [
                        TextField(
                          controller: _noteCtrl,
                          maxLines: 4,
                          decoration: InputDecoration(
                            hintText: 'Catatan tambahan untuk pengguna...\nContoh: Transfer ke rekening di atas lalu konfirmasi via WhatsApp.',
                            hintStyle: TextStyle(fontSize: 13, color: cs.onSurfaceVariant),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                            contentPadding: const EdgeInsets.all(14),
                          ),
                        ),
                      ]),
                      if (_error != null) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(8)),
                          child: Text(_error!, style: TextStyle(fontSize: 13, color: cs.onErrorContainer)),
                        ),
                      ],
                      if (_saved) ...[
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(8)),
                          child: const Row(
                            children: [
                              Icon(Icons.check_circle_rounded, size: 16, color: Color(0xFF16A34A)),
                              SizedBox(width: 8),
                              Text(
                                'Info pembayaran berhasil disimpan!',
                                style: TextStyle(fontSize: 13, color: Color(0xFF15803D), fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton.icon(
                          onPressed: _saving ? null : _save,
                          icon: _saving ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.save_rounded, size: 18),
                          label: const Text('Simpan Perubahan'),
                          style: FilledButton.styleFrom(
                            backgroundColor: const Color(0xFF6366F1),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _section(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
        const SizedBox(height: 10),
        ...children,
      ],
    );
  }

  Widget _field(TextEditingController ctrl, String label, IconData icon, {String? hint, TextInputType? inputType}) {
    return TextField(
      controller: ctrl,
      keyboardType: inputType,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        prefixIcon: Icon(icon, size: 18),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      ),
    );
  }
}
