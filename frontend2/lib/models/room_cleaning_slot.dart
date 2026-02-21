class RoomCleaningSlot {
  final String id;
  final String weekDay;
  final DateTime startTime;
  final DateTime endTime;
  final int availableSlots;

  RoomCleaningSlot({
    required this.id,
    required this.weekDay,
    required this.startTime,
    required this.endTime,
    required this.availableSlots,
  });

  factory RoomCleaningSlot.fromJson(
      Map<String, dynamic> json) {
    final dynamic rawId = json['id'] ?? json['_id'];
    final String id = rawId?.toString() ?? "";
    final dynamic rawAvailable = json['availableSlots'];
    final int availableSlots = rawAvailable is int
        ? rawAvailable
        : int.tryParse(rawAvailable?.toString() ?? "") ?? 0;

    return RoomCleaningSlot(
      id: id,
      weekDay: json['weekDay']?.toString() ?? "",
      startTime: DateTime.parse(
          json['startTime']?.toString() ?? DateTime.now().toIso8601String()),
      endTime: DateTime.parse(
          json['endTime']?.toString() ?? DateTime.now().toIso8601String()),
      availableSlots: availableSlots,
    );
  }
}
