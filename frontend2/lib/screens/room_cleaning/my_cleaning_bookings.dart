import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/room_cleaning_provider.dart';

class MyCleaningBookingsScreen extends StatefulWidget {
  const MyCleaningBookingsScreen({super.key});

  @override
  State<MyCleaningBookingsScreen> createState() =>
      _MyCleaningBookingsScreenState();
}

class _MyCleaningBookingsScreenState
    extends State<MyCleaningBookingsScreen> {

  late Future<List<dynamic>> _futureBookings;

  @override
  void initState() {
    super.initState();
    _futureBookings =
        context.read<RoomCleaningProvider>().getMyBookings();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final provider = context.read<RoomCleaningProvider>();
      provider.loadLocalBookings();
      provider.fetchMyBookings();
    });
  }

  Future<void> _refresh() async {
    setState(() {
      _futureBookings =
          context.read<RoomCleaningProvider>().getMyBookings();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text("My Cleaning Bookings"),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: FutureBuilder<List<dynamic>>(
        future: _futureBookings,
        builder: (context, snapshot) {

          if (snapshot.connectionState ==
              ConnectionState.waiting) {
            return const Center(
                child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return const Center(
                child: Text("Something went wrong"));
          }

          final bookings = snapshot.data ?? [];

          if (bookings.isEmpty) {
            return const Center(
                child: Text("No bookings yet"));
          }

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: bookings.length,
              itemBuilder: (context, index) {
                final booking = bookings[index];
                final slot = booking['slot'];

                final start = DateFormat.Hm()
                    .format(DateTime.parse(slot['startTime']));
                final end = DateFormat.Hm()
                    .format(DateTime.parse(slot['endTime']));

                final requestedDate =
                DateFormat.yMMMd().format(
                    DateTime.parse(
                        booking['requestedDate']));

                final status = booking['status'];

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius:
                    BorderRadius.circular(12),
                  ),
                  child: Padding(
                    padding:
                    const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment:
                      CrossAxisAlignment.start,
                      children: [

                        /// Time
                        Text(
                          "${slot['weekDay']
                              .toString()
                              .toUpperCase()} | $start - $end",
                          style: const TextStyle(
                            fontWeight:
                            FontWeight.w600,
                          ),
                        ),

                        const SizedBox(height: 6),

                        Text("Requested: $requestedDate"),

                        if (booking['notes'] != null &&
                            booking['notes']
                                .toString()
                                .isNotEmpty)
                          Padding(
                            padding:
                            const EdgeInsets.only(
                                top: 6),
                            child: Text(
                                "Notes: ${booking['notes']}"),
                          ),

                        const SizedBox(height: 10),

                        Row(
                          mainAxisAlignment:
                          MainAxisAlignment
                              .spaceBetween,
                          children: [

                            /// Status Badge
                            Container(
                              padding:
                              const EdgeInsets
                                  .symmetric(
                                  horizontal:
                                  10,
                                  vertical:
                                  4),
                              decoration:
                              BoxDecoration(
                                color: status ==
                                    "confirmed"
                                    ? Colors.green
                                    .withOpacity(
                                    0.1)
                                    : status ==
                                    "cancelled"
                                    ? Colors.red
                                    .withOpacity(
                                    0.1)
                                    : Colors.orange
                                    .withOpacity(
                                    0.1),
                                borderRadius:
                                BorderRadius
                                    .circular(
                                    6),
                              ),
                              child: Text(
                                status.toUpperCase(),
                                style: TextStyle(
                                  color: status ==
                                      "confirmed"
                                      ? Colors.green
                                      : status ==
                                      "cancelled"
                                      ? Colors.red
                                      : Colors
                                      .orange,
                                  fontWeight:
                                  FontWeight
                                      .w600,
                                ),
                              ),
                            ),

                            /// Cancel Button
                            if (status == "confirmed")
                              TextButton(
                                onPressed: () async {

                                  final response =
                                  await context
                                      .read<
                                      RoomCleaningProvider>()
                                      .cancelBooking(
                                      booking[
                                      '_id']);

                                  if (!mounted) return;

                                  ScaffoldMessenger
                                      .of(context)
                                      .showSnackBar(
                                    SnackBar(
                                        content: Text(
                                            response[
                                            'message'])),
                                  );

                                  _refresh();
                                },
                                child: const Text(
                                    "Cancel"),
                              )
                          ],
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
