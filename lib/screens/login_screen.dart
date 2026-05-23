import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../services/admin_api.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _userCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _passVisible = false;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _userCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    final username = _userCtrl.text.trim();
    final password = _passCtrl.text;
    if (username.isEmpty || password.isEmpty) {
      setState(() => _error = 'Username dan password wajib diisi');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<AdminApi>().login(username, password);
      if (mounted) context.go('/dashboard');
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
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 380),
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo
                Container(
                  width: 60,
                  height: 60,
                  decoration: BoxDecoration(color: const Color(0xFF6366F1), borderRadius: BorderRadius.circular(16)),
                  child: const Icon(Icons.admin_panel_settings_rounded, size: 32, color: Colors.white),
                ),
                const SizedBox(height: 24),
                Text(
                  'ArStore Admin',
                  style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: cs.onSurface),
                ),
                const SizedBox(height: 4),
                Text('Masuk untuk mengelola lisensi UtilitasKu', style: TextStyle(fontSize: 14, color: cs.onSurfaceVariant)),
                const SizedBox(height: 32),
                TextField(
                  controller: _userCtrl,
                  decoration: const InputDecoration(labelText: 'Username', prefixIcon: Icon(Icons.person_outline_rounded, size: 18), border: OutlineInputBorder()),
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _passCtrl,
                  obscureText: !_passVisible,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    prefixIcon: const Icon(Icons.lock_outline_rounded, size: 18),
                    border: const OutlineInputBorder(),
                    suffixIcon: IconButton(
                      icon: Icon(_passVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined, size: 18),
                      onPressed: () => setState(() => _passVisible = !_passVisible),
                    ),
                  ),
                  onSubmitted: (_) => _login(),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: cs.errorContainer, borderRadius: BorderRadius.circular(8)),
                    child: Text(_error!, style: TextStyle(fontSize: 13, color: cs.onErrorContainer)),
                  ),
                ],
                const SizedBox(height: 20),
                FilledButton(
                  onPressed: _loading ? null : _login,
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF6366F1),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: _loading
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Text('Masuk', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
