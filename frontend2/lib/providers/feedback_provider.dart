import 'package:flutter/material.dart';

class FeedbackProvider extends ChangeNotifier {
  String breakfast = '';
  String lunch = '';
  String dinner = '';
  String comment = '';

  // Extra SMC fields
  String hygiene = '';
  String wasteDisposal = '';
  String qualityOfIngredients = '';
  String uniformAndPunctuality = '';

  // Load SMC status
  bool isSMC = false;
  void loadSMCStatus(bool status) {
    isSMC = status;
    notifyListeners();
  }

  // Set meal feedback
  void setMealFeedback(String meal, String val) {
    switch (meal) {
      case 'breakfast':
        breakfast = val;
        break;
      case 'lunch':
        lunch = val;
        break;
      case 'dinner':
        dinner = val;
        break;
    }
    notifyListeners();
  }

  // Set extra SMC feedback
  void setSMCFeedback(String field, String val) {
    switch (field) {
      case 'hygiene':
        hygiene = val;
        break;
      case 'wasteDisposal':
        wasteDisposal = val;
        break;
      case 'qualityOfIngredients':
        qualityOfIngredients = val;
        break;
      case 'uniformAndPunctuality':
        uniformAndPunctuality = val;
        break;
    }
    notifyListeners();
  }

  // Set comment
  void setComment(String value) {
    comment = value;
    notifyListeners();
  }

  // Clear all fields
  void clear() {
    breakfast = '';
    lunch = '';
    dinner = '';
    comment = '';

    if (isSMC) {
      hygiene = '';
      wasteDisposal = '';
      qualityOfIngredients = '';
      uniformAndPunctuality = '';
    }

    notifyListeners();
  }

  // Check if feedback is complete
  bool isComplete() {
    bool basicComplete =
        breakfast.isNotEmpty && lunch.isNotEmpty && dinner.isNotEmpty;

    if (isSMC) {
      bool smcComplete = hygiene.isNotEmpty &&
          wasteDisposal.isNotEmpty &&
          qualityOfIngredients.isNotEmpty &&
          uniformAndPunctuality.isNotEmpty;
      return basicComplete && smcComplete;
    }

    return basicComplete;
  }
}
