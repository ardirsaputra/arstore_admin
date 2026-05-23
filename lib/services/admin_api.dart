import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ── Models ───────────────────────────────────────────────────────────────────

class DeviceInfo {
  final String deviceId;
  final String deviceModel;
  final String status; // 'trial' | 'active' | 'expired'
  final String? userName;
  final String? userEmail;
  final DateTime? trialStartDate;
  final DateTime? expiryDate;
  final bool isPermanent;
  final DateTime? checkedAt;

  const DeviceInfo({
    required this.deviceId,
    required this.deviceModel,
    required this.status,
    this.userName,
    this.userEmail,
    this.trialStartDate,
    this.expiryDate,
    this.isPermanent = false,
    this.checkedAt,
  });

  factory DeviceInfo.fromJson(Map<String, dynamic> j) => DeviceInfo(
        deviceId: j['device_id'] as String,
        deviceModel: j['device_model'] as String? ?? '',
        status: j['status'] as String,
        userName: j['user_name'] as String?,
        userEmail: j['user_email'] as String?,
        trialStartDate: j['trial_start_date'] != null ? DateTime.tryParse(j['trial_start_date'] as String) : null,
        expiryDate: j['expiry_date'] != null ? DateTime.tryParse(j['expiry_date'] as String) : null,
        isPermanent: j['is_permanent'] as bool? ?? false,
        checkedAt: j['checked_at'] != null ? DateTime.tryParse(j['checked_at'] as String) : null,
      );
}

class LicenseCode {
  final String code;
  final String type; // 'monthly' | '6months' | 'yearly' | '2years' | 'lifetime'
  final bool used;
  final String? usedByDeviceId;
  final DateTime createdAt;
  final DateTime? usedAt;

  const LicenseCode({required this.code, required this.type, required this.used, this.usedByDeviceId, required this.createdAt, this.usedAt});

  factory LicenseCode.fromJson(Map<String, dynamic> j) => LicenseCode(
        code: j['code'] as String,
        type: j['type'] as String,
        used: j['used'] as bool? ?? false,
        usedByDeviceId: j['used_by_device_id'] as String?,
        createdAt: DateTime.parse(j['created_at'] as String),
        usedAt: j['used_at'] != null ? DateTime.tryParse(j['used_at'] as String) : null,
      );
}

class AdminStats {
  final int totalDevices;
  final int activeDevices;
  final int trialDevices;
  final int expiredDevices;
  final int totalCodes;
  final int usedCodes;

  const AdminStats({required this.totalDevices, required this.activeDevices, required this.trialDevices, required this.expiredDevices, required this.totalCodes, required this.usedCodes});

  factory AdminStats.fromJson(Map<String, dynamic> j) => AdminStats(
        totalDevices: (j['total_devices'] as num?)?.toInt() ?? 0,
        activeDevices: (j['active_devices'] as num?)?.toInt() ?? 0,
        trialDevices: (j['trial_devices'] as num?)?.toInt() ?? 0,
        expiredDevices: (j['expired_devices'] as num?)?.toInt() ?? 0,
        totalCodes: (j['total_codes'] as num?)?.toInt() ?? 0,
        usedCodes: (j['used_codes'] as num?)?.toInt() ?? 0,
      );
}

class FeatureRequest {
  final String id;
  final String deviceId;
  final String message;
  final bool read;
  final DateTime createdAt;

  const FeatureRequest({required this.id, required this.deviceId, required this.message, required this.read, required this.createdAt});

  factory FeatureRequest.fromJson(Map<String, dynamic> j) => FeatureRequest(
        id: j['id'] as String,
        deviceId: j['device_id'] as String,
        message: j['message'] as String,
        read: j['read'] as bool? ?? false,
        createdAt: DateTime.parse(j['created_at'] as String),
      );
}

class AdminPaymentInfo {
  final String? whatsapp;
  final String? email;
  final String? bankName;
  final String? bankAccount;
  final String? bankHolder;
  final String? qrisUrl;
  final String? note;

  const AdminPaymentInfo({this.whatsapp, this.email, this.bankName, this.bankAccount, this.bankHolder, this.qrisUrl, this.note});

  factory AdminPaymentInfo.fromJson(Map<String, dynamic> j) => AdminPaymentInfo(
        whatsapp: j['whatsapp'] as String?,
        email: j['email'] as String?,
        bankName: j['bank_name'] as String?,
        bankAccount: j['bank_account'] as String?,
        bankHolder: j['bank_holder'] as String?,
        qrisUrl: j['qris_url'] as String?,
        note: j['note'] as String?,
      );

  Map<String, dynamic> toJson() => {'whatsapp': whatsapp, 'email': email, 'bank_name': bankName, 'bank_account': bankAccount, 'bank_holder': bankHolder, 'qris_url': qrisUrl, 'note': note};
}

// ── AdminApi service ─────────────────────────────────────────────────────────

/// Base URL is configurable at compile time:
///   flutter build web --dart-define=API_BASE_URL=https://your-backend.com/api/admin
///
/// Defaults to localhost:3001 for development.
class AdminApi extends ChangeNotifier {
  static const _apiBase = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:3001/api/admin',
  );
  static const _tokenKey = 'admin_token';

  static AdminApi? _instance;
  static AdminApi get instance => _instance ??= AdminApi._();
  AdminApi._() {
    _dio = Dio(BaseOptions(baseUrl: _apiBase, connectTimeout: const Duration(seconds: 10), receiveTimeout: const Duration(seconds: 15), contentType: 'application/json'));
    _restoreToken();
  }

  late final Dio _dio;
  String? _token;

  bool get isLoggedIn => _token != null;

  // ── Auth ────────────────────────────────────────────────────────────────────

  Future<void> login(String username, String password) async {
    final res = await _dio.post('/auth/login', data: {'username': username, 'password': password});
    final token = res.data['token'] as String;
    await _persistToken(token);
    _setToken(token);
    notifyListeners();
  }

  void logout() {
    _clearToken();
    notifyListeners();
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  Future<AdminStats> getStats() async {
    final res = await _authedGet('/stats');
    return AdminStats.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Devices ─────────────────────────────────────────────────────────────────

  Future<List<DeviceInfo>> getDevices({String? status, String? query}) async {
    final res = await _authedGet('/devices', queryParameters: {if (status != null) 'status': status, if (query != null && query.isNotEmpty) 'q': query});
    final list = res.data as List<dynamic>;
    return list.map((e) => DeviceInfo.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<DeviceInfo> getDevice(String deviceId) async {
    final res = await _authedGet('/devices/$deviceId');
    return DeviceInfo.fromJson(res.data as Map<String, dynamic>);
  }

  Future<DeviceInfo> activateDevice(String deviceId, {DateTime? expiryDate, bool permanent = false}) async {
    final res = await _authedPost('/devices/$deviceId/activate', data: {if (expiryDate != null) 'expiry_date': expiryDate.toIso8601String(), 'permanent': permanent});
    return DeviceInfo.fromJson(res.data as Map<String, dynamic>);
  }

  Future<DeviceInfo> revokeDevice(String deviceId) async {
    final res = await _authedPost('/devices/$deviceId/revoke', data: {});
    return DeviceInfo.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Codes ───────────────────────────────────────────────────────────────────

  Future<List<String>> generateCodes({required String type, required int quantity, int? durationMonths}) async {
    final res = await _authedPost('/codes/generate', data: {'type': type, 'quantity': quantity, if (durationMonths != null) 'duration_months': durationMonths});
    return (res.data['codes'] as List<dynamic>).cast<String>();
  }

  Future<List<LicenseCode>> getCodes({bool? unused}) async {
    final res = await _authedGet('/codes', queryParameters: {if (unused != null) 'unused': unused});
    final list = res.data as List<dynamic>;
    return list.map((e) => LicenseCode.fromJson(e as Map<String, dynamic>)).toList();
  }

  // ── Payment info ────────────────────────────────────────────────────────────

  Future<AdminPaymentInfo> getPaymentInfo() async {
    final res = await _authedGet('/payment-info');
    return AdminPaymentInfo.fromJson(res.data as Map<String, dynamic>);
  }

  Future<AdminPaymentInfo> updatePaymentInfo(AdminPaymentInfo info) async {
    final res = await _authedPut('/payment-info', data: info.toJson());
    return AdminPaymentInfo.fromJson(res.data as Map<String, dynamic>);
  }

  // ── Feature requests ────────────────────────────────────────────────────────

  Future<List<FeatureRequest>> getFeatureRequests({bool? unread}) async {
    final res = await _authedGet('/feature-requests', queryParameters: {if (unread != null) 'unread': unread});
    final list = res.data as List<dynamic>;
    return list.map((e) => FeatureRequest.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> markRequestRead(String id) async {
    await _authedPatch('/feature-requests/$id/read', data: {});
  }

  // ── HTTP helpers ─────────────────────────────────────────────────────────────

  Options get _authOpts => Options(headers: {'Authorization': 'Bearer $_token'});

  Future<Response<dynamic>> _authedGet(String path, {Map<String, dynamic>? queryParameters}) => _dio.get(path, queryParameters: queryParameters, options: _authOpts);

  Future<Response<dynamic>> _authedPost(String path, {required Map<String, dynamic> data}) => _dio.post(path, data: jsonEncode(data), options: _authOpts);

  Future<Response<dynamic>> _authedPut(String path, {required Map<String, dynamic> data}) => _dio.put(path, data: jsonEncode(data), options: _authOpts);

  Future<Response<dynamic>> _authedPatch(String path, {required Map<String, dynamic> data}) => _dio.patch(path, data: jsonEncode(data), options: _authOpts);

  // ── Token persistence ────────────────────────────────────────────────────────

  void _setToken(String token) {
    _token = token;
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  Future<void> _persistToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> _restoreToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString(_tokenKey);
    if (token != null) _setToken(token);
  }

  Future<void> _clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  /// Returns a user-friendly error message from a DioException.
  static String errorMessage(Object e) {
    if (e is DioException) {
      if (e.response != null) {
        final data = e.response!.data;
        if (data is Map) return data['message'] as String? ?? 'Server error ${e.response!.statusCode}';
        return 'Server error ${e.response!.statusCode}';
      }
      return 'Tidak dapat terhubung ke server';
    }
    return e.toString();
  }
}
