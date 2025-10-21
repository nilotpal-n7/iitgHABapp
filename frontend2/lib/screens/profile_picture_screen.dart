import 'dart:convert';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:frontend2/constants/endpoint.dart';
import 'package:frontend2/screens/MainNavigationScreen.dart';
import 'package:frontend2/widgets/common/custom_linear_progress.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';

class ProfilePictureProvider {
  static var profilePictureString = ValueNotifier<String>("");
  static void init() async {
    (await SharedPreferences.getInstance()).setString("profilePicture", "");
    profilePictureString.value = (await SharedPreferences.getInstance()).getString("profilePicture")??"";
  }
}

class ProfilePictureScreen extends StatefulWidget {
  const ProfilePictureScreen({super.key});

  @override
  State<ProfilePictureScreen> createState() => _ProfilePictureScreenState();
}

class _ProfilePictureScreenState extends State<ProfilePictureScreen> {
  @override
  void initState() {
    super.initState();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.grey[50],
        title: const Text(
          "Set Profile Picture",
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.black,
          ),
        ),
        centerTitle: false,
      ),
      body: Container(
            width: double.infinity,
            // height: double.infinity,
            color: Colors.white,
            margin: const EdgeInsets.only(top: 8),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Main content with padding
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 32),
                    child: Column(
                      children: [
                        // Profile Image
                        Container(
                          margin: const EdgeInsets.only(bottom: 24),
                          child: CircleAvatar(
                            radius: 128,
                            backgroundColor: Colors.blue[100],
                            backgroundImage: const NetworkImage(
                              "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=500",
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 32,),

                        InkWell(
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 16),
                            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                            decoration: BoxDecoration(border: Border.all(color: const Color(0xFFC5C5D1)), borderRadius: BorderRadius.circular(6)),
                            child: const Text("Set Profile Picture"),
                          ),
                          onTap: () async {
                            print("Pick Image");
                            final ImagePicker picker = ImagePicker();
                            final XFile? pfp = await picker.pickImage(source: ImageSource.gallery);
                            if (pfp != null) {
                              print("recieved File: $pfp");
                              final final_path = '${(await getTemporaryDirectory()).path}/${pfp.name}';
                              // print(final_path);
                              await FlutterImageCompress.compressAndGetFile(
                                pfp.path,
                                final_path,
                                minWidth: 256,
                                minHeight: 256,
                                quality: 85,
                              );
                              final formData = FormData.fromMap({
                                // 'file' is the field name the server expects; change as needed
                                'file': await MultipartFile.fromFile(
                                  final_path,
                                  filename: pfp.name, // XFile has a 'name' getter
                                ),
                              });
                              // final token = (await SharedPreferences.getInstance()).getString('access_token');
                              // final dio = Dio();
                              // final response = await dio.post(
                              //   ProfilePicture.changeUserProfilePicture,
                              //   data: formData,
                              //   options: Options(
                              //     headers: {
                              //       'Authorization': 'Bearer $token',
                              //     },
                              //     contentType: 'multipart/form-data',
                              //   ),
                              // );
                              // print("Uploading File Online: $response");
                              // print("Done with picture");
                              var image = base64Encode(File(final_path).readAsBytesSync());
                              ProfilePictureProvider.profilePictureString.value = image;
                              (await SharedPreferences.getInstance()).setString("profilePicture", image);
                            } else {
                              print("err");
                            }
                          },
                        ),
                        const SizedBox(height: 8,),
                        Container(padding: const EdgeInsets.symmetric(horizontal: 32), child: const Text("Please set your Profile Picture before continuing further", textAlign: TextAlign.center, )),
                        const SizedBox(height: 160,),
                      ]
                    )
                  )
                ]
              ),
            )
          )
    );
  }
}