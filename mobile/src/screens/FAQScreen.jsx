import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';

const FAQScreen = ({ navigation }) => {
  const [expandedId, setExpandedId] = useState(null);

  const faqData = [
    {
        id: 0,
        question: 'What are some limitations for the recording?',
        answer:
          'Good Question! In order for the coach to successfully analyze your form, there shouldn\'t be more than one people and more than one basketball visible while recording. You also have to put your camera perpendicular to you, meaning a side view perspective is required. It\'s best to have your camera facing your dominant hand.',
      },
    {
      id: 1,
      question: 'How does the AI analyze my shooting form?',
      answer:
        'Our AI uses computer vision and pose estimation to track 33 key points on your body in real-time. It analyzes your shooting mechanics including elbow alignment, release angle, follow-through, and body balance, then compares them to professional NBA players.',
    },
    {
      id: 2,
      question: 'Do I need an internet connection?',
      answer:
        'Yes! Currently our models run on the cloud! You need internet connections to connect to yuor AI Shooting Coach!',
    },
    {
      id: 3,
      question: 'Which NBA players can I compare with?',
      answer:
        'You can compare your form with LeBron James, Stephen Curry, Kevin Durant, Kawhi Leonard, and James Harden. Each player represents a different shooting style - from explosive power to smooth precision.',
    },
    {
      id: 4,
      question: 'What is AutoFind the Matched Player?',
      answer:
        'This BETA feature automatically analyzes your shooting form and finds which NBA player your style most closely resembles. It considers factors like release speed, arc, follow-through, and overall mechanics.',
    },
    {
      id: 5,
      question: 'How accurate is the analysis?',
      answer:
        'Our AI achieves 95%+ accuracy in pose detection, 90% on baksetball detection and provides frame-by-frame analysis at 30fps. The feedback is based on biomechanical principles used by professional shooting coaches.',
    },
    {
      id: 6,
      question: 'Can I save and review my shots later?',
      answer:
        'Our team is working hard on more features! Please stay tune for more updates and consider support this product in the future!',
    },
    {
      id: 7,
      question: 'How should I position my phone for best results?',
      answer:
        'Place your phone 10-15 feet away at waist height, capturing your full body from the side and the basketball throughout the entire shooting motion. Make sure there\'s good lighting and minimal background clutter. The app will guide you through proper positioning.',
    },
    {
      id: 8,
      question: 'Does it work indoors and outdoors?',
      answer:
        'Yes! The AI works in any lighting condition. However, for best results, avoid direct sunlight behind you and ensure your entire body is visible in the frame.',
    },
    {
    id: 9,
    question: 'Can I use it for free throws, jump shots, and three-pointers?',
    answer:
        'Absolutely! The AI analyzes all types of basketball shots. Whether you\'re practicing free throws, mid-range jumpers, or three-pointers, you\'ll get detailed feedback on your form.',
    },
    {
      id: 10,
      question: 'How long would the analysis typically take? Do I need to upgrade my phone to speed up the process?',
      answer:
        'No you Don\'t!, Our AI runs on the cloud! Unfortunately our AI now stucks on lower tier compute resources, which means a 2 seconds clips might take up to 30-45 seconds to finish analysis. We will upgrade the hardware in the future depends on the needs!',
    },
    {
      id: 11,
      question: 'What age is this app suitable for?',
      answer:
        'The app is suitable for basketball players of all ages - from youth players learning fundamentals to adult players refining their technique. The AI feedback adapts to different skill levels.',
    },
    {
      id: 12,
      question: 'How is this different from watching YouTube tutorials?',
      answer:
        'While tutorials are helpful, our AI provides personalized, real-time feedback on YOUR specific form. It\'s like having a professional shooting coach analyzing your every shot, not just watching generic advice.',
    },
    {
      id: 13,
      question: 'Can I use it on my iPad?',
      answer:
        'Yes! The app works on both iPhone and iPad. iPads with their larger screens can provide an even better viewing experience for reviewing your shots.',
    }
  ];

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Frequently Asked Questions</Text>
        <Text style={styles.subtitle}>
          Everything you need to know about AI Basketball Shooting Coach
        </Text>

        {faqData.map((item) => (
          <View key={item.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <Text style={styles.question}>{item.question}</Text>
              <Text style={styles.expandIcon}>
                {expandedId === item.id ? '−' : '+'}
              </Text>
            </TouchableOpacity>

            {expandedId === item.id && (
              <View style={styles.answerContainer}>
                <Text style={styles.answer}>{item.answer}</Text>
              </View>
            )}
          </View>
        ))}

        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Still have questions?</Text>
          <Text style={styles.contactText}>
            Contact us at 930404d@gmail.com
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1E1E1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 50,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginBottom: 30,
    lineHeight: 22,
  },
  faqItem: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    paddingRight: 15,
    lineHeight: 22,
  },
  expandIcon: {
    fontSize: 24,
    color: '#4ECDC4',
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center',
  },
  answerContainer: {
    padding: 20,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  answer: {
    fontSize: 15,
    color: '#CCCCCC',
    lineHeight: 22,
  },
  contactSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  contactText: {
    fontSize: 15,
    color: '#4ECDC4',
    textAlign: 'center',
  },
});

export default FAQScreen;